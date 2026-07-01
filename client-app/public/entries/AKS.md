# Azure Kubernetes Service

## Intro

Azure Kubernetes Service (AKS) is Microsoft's managed Kubernetes offering. It runs the Kubernetes control plane for you — API server, scheduler, controller manager, etcd — while you manage the worker nodes (or let Azure manage those too with node auto-provisioning).

You get standard Kubernetes APIs and tooling (`kubectl`, Helm, GitOps) without operating etcd backups, control plane upgrades, or controller patching yourself.

**Why teams reach for AKS:**

- **Managed control plane** — Azure handles upgrades, patching, and HA for the Kubernetes API
- **Azure integration** — native hooks for Azure AD, Key Vault, Monitor, Container Registry, Load Balancer, and managed disks
- **Standard Kubernetes** — portable workloads; no proprietary orchestration API
- **Flexible node pools** — mix VM sizes, spot instances, GPU nodes, and Windows/Linux in one cluster
- **Enterprise features** — private clusters, Azure CNI, workload identity, Azure Policy add-on

AKS removes control-plane toil but not all Kubernetes complexity. See [general Kubernetes drawbacks](./kubernetes.md#drawbacks) and [AKS-specific drawbacks](#drawbacks) below.

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure Subscription                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    AKS Cluster (Region)                     │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │         Managed Control Plane (Azure-operated)      │    │  │
│  │  │   API Server │ Scheduler │ Controller Manager │ etcd│    │  │
│  │  └──────────────────────────┬──────────────────────────┘    │  │
│  │                             │                               │  │
│  │         ┌───────────────────┼───────────────────┐           │  │
│  │         ▼                   ▼                   ▼           │  │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │  │
│  │  │ Node Pool   │     │ Node Pool   │     │ Node Pool   │    │  │
│  │  │  (system)   │     │  (apps)     │     │  (spot)     │    │  │
│  │  │ ┌───┐ ┌───┐ │     │ ┌───┐ ┌───┐ │     │ ┌───┐       │    │  │
│  │  │ │Pod│ │Pod│ │     │ │Pod│ │Pod│ │     │ │Pod│ ...   │    │  │
│  │  │ └───┘ └───┘ │     │ └───┘ └───┘ │     │ └───┘       │    │  │
│  │  └─────────────┘     └─────────────┘     └─────────────┘    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Azure AD     │  │ Key Vault    │  │ Container    │              │
│  │ (RBAC/SSO)   │  │ (secrets)    │  │ Registry     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Role |
|-----------|------|
| **Control plane** | Kubernetes API and cluster brain; managed and billed at no extra cost (you pay for nodes) |
| **Node pool** | A group of VMs with the same SKU, OS, and scaling rules |
| **System node pool** | Runs core cluster add-ons (CoreDNS, metrics-server); keep at least one |
| **User node pool** | Runs your application workloads |
| **kubelet / kube-proxy** | Agent processes on each node; register with the control plane |
| **Azure CNI / kubenet** | Container networking plugins; CNI assigns VNet IPs, kubenet uses overlay |
| **Azure Load Balancer** | Fronts `Service` type LoadBalancer and Ingress controllers |
| **Managed identity** | Lets pods and cluster components authenticate to Azure without secrets in YAML |

---

## How a Request Reaches Your App

```
Internet / VNet
      │
      ▼
┌─────────────────┐
│ Azure Load      │  ← Service type LoadBalancer or Ingress (nginx/App Gateway)
│ Balancer        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service         │  ← ClusterIP / LoadBalancer; stable virtual IP + DNS
│ (ClusterIP/LB)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Endpoints       │  ← Backing pod IPs (managed automatically)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ Pod   │ │ Pod   │  ← Containers in ReplicaSet / Deployment
│ :8080 │ │ :8080 │
└───────┘ └───────┘
```

**Traffic path summary:** Ingress or LoadBalancer → Service → Endpoints → Pod containers.

---

## Core Kubernetes Objects on AKS

| Object | Purpose | AKS note |
|--------|---------|----------|
| **Namespace** | Logical isolation | Use for env (dev/staging) or team boundaries |
| **Deployment** | Declarative app rollout with rolling updates | Preferred over bare Pods |
| **Service** | Stable network endpoint for pods | `LoadBalancer` creates an Azure public IP |
| **Ingress** | HTTP(S) routing to services | Pair with nginx, Traefik, or Application Gateway |
| **ConfigMap / Secret** | Config and sensitive data | Prefer Key Vault + CSI driver for secrets |
| **PersistentVolumeClaim** | Request durable storage | Backed by Azure Disk or Azure Files |
| **HorizontalPodAutoscaler** | Scale pods on CPU/memory/custom metrics | Works with cluster autoscaler for nodes |

---

## Quick Start: Create a Cluster

### Azure CLI

```bash
# Resource group
az group create --name rg-aks-demo --location eastus

# Create cluster (single node pool, managed identity)
az aks create \
  --resource-group rg-aks-demo \
  --name aks-demo \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys

# Merge credentials into kubeconfig
az aks get-credentials --resource-group rg-aks-demo --name aks-demo

# Verify
kubectl get nodes
```

### Minimal Deployment Example

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry.azurecr.io/api:1.0.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
```

```bash
kubectl apply -f deployment.yaml
kubectl get svc api          # wait for EXTERNAL-IP
curl http://<EXTERNAL-IP>/
```

---

## Node Pools and Scaling

```
Cluster: aks-prod
├── system pool     (2 × Standard_D2s_v3)   ← kube-system add-ons
├── apps pool       (3–10 × Standard_D4s_v3) ← HPA + cluster autoscaler
└── spot pool       (0–5 × Spot)             ← fault-tolerant batch jobs
```

### Cluster Autoscaler + HPA

```
CPU usage rises
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ HPA         │ ──► │ More pods   │ ──► │ Pending pods│
│ (pod scale) │     │ scheduled   │     │ (no capacity)│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Cluster     │
                                        │ Autoscaler  │
                                        │ adds nodes  │
                                        └─────────────┘
```

```bash
# Enable cluster autoscaler on a node pool
az aks nodepool update \
  --resource-group rg-aks-demo \
  --cluster-name aks-demo \
  --name nodepool1 \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 6
```

**Rule of thumb:** set pod `requests` accurately — the scheduler and autoscaler depend on them.

---

## Networking: Azure CNI vs kubenet

| | **Azure CNI** | **kubenet** |
|---|---------------|-------------|
| Pod IP | Real VNet IP address | Overlay network (NAT via node IP) |
| IP planning | Must size subnet for max pods × nodes | Fewer VNet IPs consumed |
| Network policies | Supported | Supported (with limitations) |
| Private/on-prem integration | Easier direct routing | Usually requires extra routing |
| Typical use | Production, hybrid, strict networking | Dev/test, IP-constrained subnets |

```
VNet: 10.0.0.0/16
├── subnet-nodes:   10.0.1.0/24
└── subnet-pods:    10.0.2.0/22   ← Azure CNI assigns pod IPs from here

         Node 10.0.1.4
         ├── Pod 10.0.2.10
         ├── Pod 10.0.2.11
         └── Pod 10.0.2.12
```

---

## Identity and Secrets

### Workload Identity (recommended)

Pods authenticate to Azure APIs (Key Vault, Storage, SQL) via federated credentials — no client secrets mounted in the cluster.

```
Pod (service account)
      │
      │ OIDC token
      ▼
Azure AD ──► federated credential ──► Managed Identity ──► Key Vault
```

```bash
# Enable OIDC issuer and workload identity on the cluster
az aks update \
  --resource-group rg-aks-demo \
  --name aks-demo \
  --enable-oidc-issuer \
  --enable-workload-identity
```

### Secrets: avoid plain Kubernetes Secrets in Git

| Approach | When to use |
|----------|-------------|
| **Key Vault CSI driver** | Production secrets; rotation via Key Vault |
| **Sealed Secrets / External Secrets Operator** | GitOps with encrypted or synced secrets |
| **Kubernetes Secret** | Short-lived dev only; never commit to source control |

---

## Ingress and TLS

```
Client ──HTTPS──► Application Gateway / nginx Ingress
                         │
                         ├── /api  ──► Service api:80
                         └── /web  ──► Service web:80
```

Example Ingress (nginx):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

---

## Observability

| Signal | Azure tool | What to watch |
|--------|------------|---------------|
| **Metrics** | Azure Monitor / Container insights | Node CPU, pod restarts, API server latency |
| **Logs** | Log Analytics workspace | Container stdout, audit logs |
| **Traces** | Application Insights (OpenTelemetry) | Request latency across services |
| **Alerts** | Azure Monitor alerts | Pod crash loops, node NotReady, high memory |

```bash
# Enable Container insights add-on
az aks enable-addons \
  --resource-group rg-aks-demo \
  --name aks-demo \
  --addons monitoring \
  --workspace-resource-id <log-analytics-workspace-id>
```

**High-signal kubectl checks:**

```bash
kubectl get pods -A | grep -v Running          # unhealthy pods
kubectl top nodes
kubectl top pods -A
kubectl describe pod <name>                  # events at the bottom
```

---

## GitOps Deployment Flow

```
Developer ──push──► Git repo (manifests / Helm)
                         │
                         ▼
                   ┌───────────┐
                   │ Argo CD / │
                   │ Flux      │  ← runs inside AKS
                   └─────┬─────┘
                         │ sync
                         ▼
                   AKS cluster state
```

Benefits: auditable deploys, rollbacks via Git revert, drift detection. AKS does not include GitOps — you add Argo CD or Flux.

---

## Security Essentials

| Control | Purpose |
|---------|---------|
| **Azure RBAC + K8s RBAC** | Map Azure AD groups to cluster roles |
| **Private cluster** | API server on private endpoint; no public API |
| **Network policies** | Restrict pod-to-pod traffic (Calico on AKS) |
| **Pod Security Standards** | Block privileged pods in production namespaces |
| **Azure Policy add-on** | Enforce tags, allowed images, resource limits |
| **Defender for Containers** | Vulnerability scanning and runtime threat detection |

```
                    Public internet
                          │
              ┌───────────┴───────────┐
              │  (optional) APIM /    │
              │  Front Door / WAF     │
              └───────────┬───────────┘
                          │
              Private cluster API ── VPN / ExpressRoute / Bastion
                          │
                     AKS workloads
```

---

## Common Patterns

### Microservices behind a service mesh (optional)

```
[svc-a] ◄──► [svc-b] ◄──► [svc-c]
    │            │            │
    └────────────┴────────────┘
              Istio / Linkerd
         (mTLS, retries, traffic split)
```

Use when you need fine-grained traffic management; adds operational complexity — not required for every AKS deployment.

### Blue/green or canary via Deployment

```bash
# Canary: second Deployment with label app=api-canary, adjust Service selector
# or use Ingress weight annotations / service mesh VirtualService
kubectl set image deployment/api api=myregistry.azurecr.io/api:2.0.0
kubectl rollout status deployment/api
kubectl rollout undo deployment/api   # rollback
```

### Stateful workloads

```
Deployment  → stateless apps (API, workers)
StatefulSet → stable pod names, ordered rollout (Kafka, Elasticsearch)
Job / CronJob → one-off or scheduled tasks
```

Use **Azure Disk** (ReadWriteOnce) or **Azure Files** (ReadWriteMany) via PVCs.

---

## Configuration Essentials

| Setting | What it controls | Typical value |
|---------|------------------|---------------|
| Node VM SKU | CPU/RAM per node | `Standard_D4s_v3` for general apps |
| `--max-pods` | Pods per node (CNI) | Plan subnet size accordingly (default 30–250) |
| Cluster autoscaler min/max | Node pool bounds | Min = baseline HA; max = cost ceiling |
| Pod CPU/memory requests | Scheduling + HPA accuracy | Set to expected steady-state usage |
| `replicas` | Availability | ≥ 2 for production; spread across zones if enabled |
| Upgrade channel | Control plane + node K8s version | `stable` or `rapid` based on risk tolerance |

**Rule of thumb:** run at least two nodes across availability zones for production (`--zones 1 2 3` on node pool create).

---

## Best Practices

### Cluster design

- Use **separate node pools** for system vs apps vs spot/batch workloads
- Enable **managed identity** on the cluster and ACR integration (`az aks update --attach-acr`)
- Prefer **Azure CNI** in production unless VNet IP space is severely constrained
- Tag all Azure resources for cost allocation (team, env, app)

### Workloads

- Set **requests and limits** on every container
- Define **liveness and readiness** probes — AKS cannot heal what it cannot detect
- Use **PodDisruptionBudgets** so node drains and upgrades do not take all replicas offline
- Pin images by **digest or semver tag**, not `latest`

### Operations

- Automate upgrades: control plane first, then node pools (surge upgrades reduce downtime)
- Back up etcd state indirectly by treating cluster as cattle — GitOps is the source of truth
- Test node drain and pod eviction before production cutover
- Monitor **Cluster Autoscaler** scale-down delays (10 min default) when cost-tuning

### Cost

- Use **spot node pools** for interruptible jobs (batch, CI runners)
- Right-size nodes; many small pods on oversized VMs wastes capacity
- Scale to zero dev clusters outside business hours (stop/start or scheduled scaling)

---

## Common Pitfalls

| Pitfall | What goes wrong | Fix |
|---------|-----------------|-----|
| Subnet too small (Azure CNI) | Pods fail to schedule with IP exhaustion | Size pod subnet: nodes × maxPods × headroom |
| No resource requests | HPA and autoscaler make poor decisions; noisy neighbor | Set requests on all containers |
| Single node pool for everything | App churn disrupts system pods | Separate system and user pools |
| Secrets in Git | Credential leak | Key Vault CSI or External Secrets |
| Public API server in prod | Broader attack surface | Private cluster + authorized IP or VPN |
| `latest` image tag | Unpredictable rollouts | Immutable tags or digests |
| Ignoring pod disruption | All replicas terminate during upgrade | PDB + minAvailable ≥ 1 |
| LoadBalancer per microservice | Many public IPs, higher cost | Single Ingress / App Gateway front door |

---

## AKS vs Self-Managed Kubernetes on Azure

| | **AKS** | **Self-managed (VMs + kubeadm)** |
|---|---------|----------------------------------|
| Control plane ops | Azure-managed | You manage |
| Upgrade effort | Node pool upgrade commands | Full cluster lifecycle |
| Azure integration | First-class add-ons | Manual wiring |
| Flexibility | Some kube-apiserver flags fixed | Full control |
| Best for | Most teams running on Azure | Rare compliance/custom control plane needs |

---

## Drawbacks

AKS reduces control-plane burden but inherits most [Kubernetes drawbacks](./kubernetes.md#drawbacks). These are the **Azure-specific** ones on top.

| Drawback | Impact |
|----------|--------|
| **You still pay for nodes** | Control plane is free; VM, disk, LB, and egress costs add up quickly on small workloads |
| **Azure CNI IP planning** | Pod IPs come from your VNet — easy to exhaust subnets; re-IP often means rebuilding node pools |
| **Load Balancer sprawl** | Each `Service` type `LoadBalancer` provisions an Azure LB + public IP; cost and quota pressure |
| **Azure coupling** | Workload Identity, Key Vault CSI, Azure Disk/File, Monitor — portable K8s YAML, less portable ops |
| **Upgrade coordination** | Control plane and node pool versions must stay in supported skew; surge upgrades still cause pod churn |
| **Private cluster friction** | API on private endpoint improves security but complicates CI/CD, local `kubectl`, and break-glass access |
| **Observability cost** | Container insights → Log Analytics; ingestion GB charges can surprise teams at scale |
| **Regional and quota limits** | VM SKUs, public IPs, and cores per region can block scale-out during incidents |
| **Windows node pools** | Possible but slower pulls, larger images, and different patch cadence than Linux |
| **Platform team still required** | Managed ≠ magic; someone must own add-ons, RBAC, network policy, and runbooks |

```
App Service / Container Apps     AKS
────────────────────────────     ───
Deploy from Git / image          Cluster + node pools + add-ons
Built-in HTTPS                   Ingress / App Gateway + cert-manager
Managed scaling                  HPA + cluster autoscaler + tuning
Azure-native auth                Workload Identity setup + federated creds
Lower baseline cost              Higher floor cost, more flexibility
```

**When AKS is the wrong Azure choice:** a single API with modest traffic is often cheaper and faster on **Azure Container Apps** or **App Service**. AKS pays off when you need multi-service orchestration, custom networking, or team-wide K8s standards.

---

## When NOT to Use AKS

See [Drawbacks](#drawbacks) above. AKS is a poor default when:

- A single small app with no scaling needs (App Service or Container Apps may be simpler and cheaper)
- Strict multi-cloud portability with zero Azure coupling (plain K8s on another cloud, or Nomad)
- Team has no capacity to learn Kubernetes operations (even managed K8s has a learning curve)
- Hard real-time edge deployments (consider AKS Edge Essentials or lighter runtimes)
- Batch-only workloads with no long-running services (Azure Batch or Container Apps jobs)

---

## Ecosystem

| Tool | Purpose |
|------|---------|
| **Helm** | Package and templatize Kubernetes manifests |
| **Argo CD / Flux** | GitOps continuous delivery |
| **cert-manager** | Automated TLS certificate issuance |
| **External Secrets Operator** | Sync Key Vault secrets into the cluster |
| **Keda** | Event-driven autoscaling (queues, Kafka lag, cron) |
| **Azure Service Operator** | Manage Azure resources (SQL, Storage) from Kubernetes CRDs |
| **Bicep / Terraform** | Infrastructure-as-code for AKS and surrounding resources |

---

## Resources

- [AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [AKS Best Practices](https://learn.microsoft.com/en-us/azure/aks/best-practices)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Azure AKS Workshop](https://azure.github.io/aks-workshop/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/quick-reference/)

---

## Next Steps

- [ ] Create a dev cluster with `az aks create` and deploy the sample Deployment above
- [ ] Attach Azure Container Registry and pull a private image
- [ ] Enable Container insights and explore pod logs in Log Analytics
- [ ] Add an Ingress controller and terminate TLS with cert-manager
- [ ] Configure workload identity to read a secret from Key Vault
- [ ] Set up a GitOps repo with Argo CD or Flux for one service
