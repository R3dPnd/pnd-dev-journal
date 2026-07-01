# Kubernetes

## Intro

Kubernetes (often abbreviated **K8s**) is an open-source container orchestration platform. It automates deploying, scaling, and operating application containers across a cluster of machines.

You declare **what** you want — three replicas of an API, a load-balanced service, persistent storage — and Kubernetes continuously reconciles the actual cluster state toward that desired state.

**Why teams reach for Kubernetes:**

- **Portability** — same APIs and manifests run on any cloud or on-premises
- **Self-healing** — restarts failed containers, replaces unhealthy nodes' workloads
- **Scaling** — horizontal pod autoscaling and cluster-level node scaling
- **Rolling updates** — deploy new versions with minimal downtime and easy rollback
- **Service discovery** — built-in DNS and load balancing between microservices
- **Ecosystem** — Helm, GitOps, service meshes, operators, and CNCF tooling

For Azure-specific managed deployment, see [AKS](./AKS.md). For honest tradeoffs, see [Drawbacks](#drawbacks) below.

---

## Core Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Control Plane               │
                    │                                     │
                    │  ┌───────────┐    ┌──────────────┐  │
                    │  │ API Server│◄──►│    etcd      │  │
                    │  └─────┬─────┘    │ (state store)│  │
                    │        │          └──────────────┘  │
                    │  ┌─────▼─────┐  ┌──────────────┐  │
                    │  │ Scheduler │  │ Controller   │  │
                    │  │           │  │ Manager      │  │
                    │  └───────────┘  └──────────────┘  │
                    └──────────────┬──────────────────────┘
                                   │ watches / commands
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
       │   Node 1    │      │   Node 2    │      │   Node 3    │
       │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │
       │ │ kubelet │ │      │ │ kubelet │ │      │ │ kubelet │ │
       │ └────┬────┘ │      │ └────┬────┘ │      │ └────┬────┘ │
       │ ┌────▼────┐ │      │ ┌────▼────┐ │      │ ┌────▼────┐ │
       │ │  Pods   │ │      │ │  Pods   │ │      │ │  Pods   │ │
       │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │
       └─────────────┘      └─────────────┘      └─────────────┘
```

### Control Plane Components

| Component | Role |
|-----------|------|
| **API Server** | Front door for all cluster operations; validates and persists objects to etcd |
| **etcd** | Distributed key-value store holding cluster state |
| **Scheduler** | Assigns pods to nodes based on resources, affinity, taints |
| **Controller Manager** | Runs controllers (Deployment, ReplicaSet, Node, etc.) that reconcile desired vs actual state |
| **Cloud Controller Manager** | Cloud-specific integrations (load balancers, volumes) — optional on bare metal |

### Node Components

| Component | Role |
|-----------|------|
| **kubelet** | Agent on each node; ensures containers in pods are running |
| **kube-proxy** | Maintains network rules so Services reach backend pods |
| **Container runtime** | containerd, CRI-O, or Docker (deprecated as direct runtime) — actually runs containers |
| **CNI plugin** | Assigns pod IP addresses and network connectivity |

---

## The Reconciliation Loop

Kubernetes is **declarative**. You submit YAML; controllers watch the API and act until reality matches intent.

```
You: kubectl apply -f deployment.yaml
              │
              ▼
        ┌─────────────┐
        │  API Server │ ──► etcd stores desired state
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │ Deployment  │ ──► creates/updates ReplicaSet
        │ Controller  │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │ ReplicaSet  │ ──► ensures N pod replicas exist
        │ Controller  │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │  Scheduler  │ ──► binds unscheduled pods to nodes
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │   kubelet   │ ──► pulls image, starts containers
        └─────────────┘
```

If a pod crashes, the ReplicaSet controller creates a replacement. You do not manually restart it.

---

## Object Hierarchy

```
Namespace
  └── Deployment          ← what you usually manage
        └── ReplicaSet    ← manages pod count (internal)
              └── Pod     ← smallest deployable unit
                    └── Container(s)
```

| Layer | You create it? | Purpose |
|-------|----------------|---------|
| **Pod** | Rarely directly | One or more containers sharing network/storage |
| **ReplicaSet** | No (via Deployment) | Keeps N identical pods running |
| **Deployment** | Yes | Declarative updates, rollouts, rollbacks |
| **StatefulSet** | Yes | Stable identity, ordered rollout (databases, queues) |
| **DaemonSet** | Yes | One pod per node (log agents, monitoring) |
| **Job / CronJob** | Yes | Run-to-completion or scheduled tasks |

---

## Pods: The Atomic Unit

A pod wraps one or more containers that share:

- A single IP address
- `localhost` networking between containers
- Mounted volumes

```
Pod: "api-7d4f9b-xk2lm"
┌─────────────────────────────────────────┐
│  IP: 10.244.1.15                        │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  api        │  │  sidecar        │   │
│  │  :8080      │  │  (log shipper)  │   │
│  └─────────────┘  └─────────────────┘   │
│  Shared volumes: /data, /config         │
└─────────────────────────────────────────┘
```

**Pod lifecycle phases:** `Pending` → `Running` → `Succeeded` / `Failed`. Pods are ephemeral — never treat a pod IP as permanent.

Example pod spec:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
      resources:
        requests:
          cpu: 100m
          memory: 64Mi
        limits:
          cpu: 200m
          memory: 128Mi
```

In practice, wrap pods in a Deployment instead of creating bare Pods.

---

## Labels, Selectors, and Annotations

**Labels** are key/value pairs used to identify and group objects. **Selectors** query those labels.

```yaml
metadata:
  labels:
    app: api
    tier: backend
    env: prod
```

```
Deployment selector: app=api
        │
        ▼ matches labels on
Service selector:   app=api  ──►  Pod labels: app=api
```

**Annotations** store non-identifying metadata (build SHA, contact email, last-deployed-by). They are not used for selectors.

---

## Deployments and Rollouts

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry.io/api:1.2.0
          ports:
            - containerPort: 8080
```

### Rolling update flow

```
Replicas: 3 × v1.2.0
              │
              │ set image to v1.3.0
              ▼
Step 1:  2 × v1.2.0  +  1 × v1.3.0   (maxSurge: 1)
Step 2:  1 × v1.2.0  +  2 × v1.3.0
Step 3:  0 × v1.2.0  +  3 × v1.3.0   ✓ complete
```

```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/api
kubectl rollout history deployment/api
kubectl rollout undo deployment/api              # revert to previous
kubectl rollout undo deployment/api --to-revision=2
```

---

## Services and Networking

Pods come and go; Services provide a **stable virtual IP and DNS name**.

| Service type | Behavior |
|--------------|----------|
| **ClusterIP** | Internal-only virtual IP (default) |
| **NodePort** | Exposes on each node's IP at a static port |
| **LoadBalancer** | Provisions a cloud load balancer (when supported) |
| **ExternalName** | DNS CNAME to an external hostname |

```
                    ┌─────────────────┐
  curl api:8080 ──► │ Service "api"   │  ClusterIP 10.96.0.42
  (in-cluster DNS)  │ selector:       │
                    │   app=api       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              Pod 10.244.1.5   Pod 10.244.2.8
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 8080
      targetPort: 8080
```

### DNS inside the cluster

```
Service "api" in namespace "prod":

  api                          → ClusterIP (same namespace)
  api.prod.svc.cluster.local   → fully qualified
```

### Ingress (HTTP routing)

Ingress sits above Services for path/host-based routing and TLS termination. Requires an **Ingress controller** (nginx, Traefik, etc.).

```
Client ──HTTPS──► Ingress Controller
                       │
                       ├── /api  ──► Service api:8080
                       └── /     ──► Service web:80
```

---

## ConfigMaps and Secrets

| Object | Stores | Mounted as |
|--------|--------|------------|
| **ConfigMap** | Non-sensitive config (URLs, feature flags) | env vars or files |
| **Secret** | Sensitive data (tokens, certs) | env vars or files (base64 in etcd) |

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: info
  CACHE_TTL: "300"
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  DATABASE_URL: postgres://user:pass@db:5432/app
```

Reference in a pod:

```yaml
spec:
  containers:
    - name: api
      envFrom:
        - configMapRef:
            name: api-config
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: DATABASE_URL
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
  volumes:
    - name: config-vol
      configMap:
        name: api-config
```

**Production note:** Kubernetes Secrets are encoded, not encrypted by default. Use external secret managers or encryption at rest for sensitive workloads.

---

## Storage

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ StorageClass │ ──► │ Persistent   │ ──► │ Pod volume   │
│ (provisioner)│     │ Volume (PV)  │     │ mount        │
└──────────────┘     └──────▲───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │ PVC (claim)  │  ← you create this
                     └──────────────┘
```

| Access mode | Meaning |
|-------------|---------|
| **ReadWriteOnce (RWO)** | Single node read/write |
| **ReadOnlyMany (ROX)** | Many nodes read-only |
| **ReadWriteMany (RWX)** | Many nodes read/write (NFS, cloud files) |

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

Use **StatefulSet + PVC templates** for stateful apps (databases). Use Deployments with ephemeral storage for stateless APIs.

---

## Health Checks

| Probe | Purpose | Typical check |
|-------|---------|---------------|
| **Liveness** | Is the container alive? Restart if failing | `/health` returns 200 |
| **Readiness** | Is it ready for traffic? Remove from Service endpoints if failing | `/ready` checks DB connection |
| **Startup** | Slow-starting app; disables liveness until first success | Same as liveness, longer timeout |

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
```

```
Pod starting
    │
    ▼ startupProbe passes (or skipped)
    │
    ▼ readinessProbe passes ──► added to Service endpoints
    │
    ▼ livenessProbe fails ──► kubelet restarts container
```

---

## Scheduling: Affinity, Taints, Tolerations

**Node affinity** — prefer or require certain nodes:

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: disktype
              operator: In
              values: [ssd]
```

**Taints and tolerations** — repel pods unless they tolerate the taint:

```
Node taint:  dedicated=gpu:NoSchedule
                    │
                    ▼ only pods with matching toleration land here
Pod toleration: dedicated=gpu:NoSchedule
```

Use taints to reserve nodes for specific workloads (GPU, system add-ons).

---

## Namespaces and RBAC

**Namespaces** partition a cluster logically:

```
cluster
├── namespace: dev
├── namespace: staging
└── namespace: prod
```

**RBAC** controls who can do what:

```
Subject (User / ServiceAccount)
      │
      ▼ bound by RoleBinding
Role (rules: get/list pods in namespace "prod")
      │
      ▼ applies to
Resources in namespace "prod"
```

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api
  namespace: prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
  - kind: ServiceAccount
    name: api
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

Principle of least privilege: each workload gets its own ServiceAccount with minimal permissions.

---

## Autoscaling

### Horizontal Pod Autoscaler (HPA)

Scales pod replicas based on metrics (CPU, memory, or custom):

```
CPU > target threshold
        │
        ▼
┌───────────────┐
│ HPA           │ ──► Deployment replicas: 3 → 6
└───────────────┘
```

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Requires accurate pod `requests`** — HPA compares usage against requests, not limits.

### Cluster Autoscaler

Adds or removes **nodes** when pods cannot be scheduled (pending due to insufficient CPU/memory). Cloud-specific or self-hosted; pairs with HPA in production.

---

## Local Development: minikube / kind

```bash
# kind — Kubernetes in Docker (great for CI and local dev)
kind create cluster --name dev
kubectl cluster-info --context kind-dev

# minikube — single-node local cluster
minikube start
minikube dashboard
```

Both give you a real API server and scheduler. Manifests you write locally apply to production clusters with minimal changes.

---

## Essential kubectl Commands

```bash
# Context and info
kubectl config get-contexts
kubectl cluster-info
kubectl get nodes

# Workloads
kubectl get pods -A
kubectl describe pod <name>
kubectl logs <pod> -f
kubectl logs <pod> -c <container>    # multi-container pod
kubectl exec -it <pod> -- /bin/sh

# Apply and diff
kubectl apply -f manifest.yaml
kubectl diff -f manifest.yaml

# Scaling and updates
kubectl scale deployment/api --replicas=5
kubectl set image deployment/api api=myregistry.io/api:2.0.0

# Debugging
kubectl get events --sort-by='.lastTimestamp'
kubectl top pods
kubectl port-forward svc/api 8080:8080   # local access to a service
```

**Imperative vs declarative:** prefer `kubectl apply` with version-controlled YAML over `kubectl run` one-liners.

---

## Multi-Container Patterns

### Sidecar

Main app + helper container in the same pod (logging, proxy, config sync):

```
Pod
├── app container      ← your service
└── sidecar container  ← ships logs / proxies TLS / watches config
```

### Init container

Runs to completion before app containers start (wait for DB, migrate schema):

```
Init: wait-for-db  ──► completes
Init: run-migration ──► completes
App:  api           ──► starts
```

---

## Helm and Kustomize

Raw YAML does not scale across environments. Two common approaches:

| Tool | Approach |
|------|----------|
| **Helm** | Templated charts with values files (`values-dev.yaml`, `values-prod.yaml`) |
| **Kustomize** | Overlays that patch a base manifest (built into `kubectl apply -k`) |

```
Helm chart
  templates/deployment.yaml   ← {{ .Values.replicas }}
  values.yaml                 ← replicas: 3

Kustomize
  base/deployment.yaml
  overlays/prod/kustomization.yaml  ← patches replicas, image tag
```

Both produce standard Kubernetes objects — no lock-in.

---

## GitOps

```
Git repo (manifests)
      │
      ▼
Argo CD / Flux  ── watches repo, syncs to cluster
      │
      ▼
Live cluster state
```

Cluster state is driven by Git commits. Rollback = revert a commit. Drift (manual `kubectl edit`) is detected and optionally auto-corrected.

---

## Best Practices

### Workloads

- Manage apps with **Deployments**, not bare Pods
- Set **requests and limits** on every container
- Define **liveness, readiness, and startup** probes
- Use **PodDisruptionBudgets** so voluntary disruptions (upgrades, drains) keep minimum availability
- Pin images by **tag or digest**, not `latest`

### Configuration

- Keep config in **ConfigMaps**; keep secrets out of Git
- Use **namespaces** to separate environments or teams
- Label everything consistently: `app`, `version`, `team`, `env`

### Operations

- Treat clusters as **cattle**, not pets — GitOps is the source of truth
- Test **node drains** and rollouts in staging before production
- Monitor pod restarts, pending pods, and failed scheduling events
- Run **at least two replicas** for production services

### Security

- Enable **RBAC**; disable anonymous access
- Run containers as **non-root** where possible
- Apply **NetworkPolicies** to restrict pod-to-pod traffic
- Use **Pod Security Standards** (restricted baseline in prod)
- Scan images for vulnerabilities in CI

---

## Common Pitfalls

| Pitfall | What goes wrong | Fix |
|---------|-----------------|-----|
| Bare Pods | No self-healing or rollout strategy | Use Deployments |
| No resource requests | Poor scheduling; HPA useless | Set CPU/memory requests |
| Missing readiness probe | Traffic hits starting/crashing pods | Add readiness checks |
| Liveness too aggressive | Restart loops on slow startup | Use startupProbe or increase delays |
| Config in container image | Rebuild to change a flag | ConfigMaps / env injection |
| Secrets in Git | Credential exposure | External secrets operator or sealed secrets |
| One namespace for everything | RBAC and blast radius issues | Separate by env or team |
| Ignoring pod eviction | All replicas die during node drain | PodDisruptionBudget |
| `kubectl edit` in prod | Untracked drift | GitOps + apply from repo |

---

## Drawbacks

Kubernetes solves hard problems, but those problems come with real costs. Many teams adopt K8s for portability and scale, then discover the **operational tax** that follows.

```
Simple app on a VM/PaaS          Kubernetes deployment
───────────────────────          ─────────────────────
  docker run                         Deployment
                                     Service
                                     Ingress + controller
                                     ConfigMap / Secret
                                     RBAC / ServiceAccount
                                     HPA + metrics-server
                                     NetworkPolicy
                                     GitOps pipeline
                                     on-call runbooks
```

### Complexity and learning curve

| Drawback | Impact |
|----------|--------|
| **Large surface area** | Pods, Services, Ingress, RBAC, storage classes, CRDs — each layer has its own failure modes |
| **Steep onboarding** | Developers must understand orchestration concepts, not just containers |
| **Implicit behavior** | Controllers reconcile asynchronously; cause and effect are not always immediate or obvious |
| **Debugging indirection** | A failing HTTP request may involve Ingress → Service → Endpoints → Pod → node → CNI — not a single log file |

You are not just deploying an app; you are operating a distributed system whose job is to run your app.

### Operational overhead

Even with managed control planes ([AKS](./AKS.md), EKS, GKE), you still own:

- Node pool sizing, upgrades, and cordoning/draining
- Cluster add-ons (Ingress controller, cert-manager, metrics, DNS)
- Version skew between cluster API and client tools
- Incident response for scheduling failures, OOM kills, and network partitions

**Self-hosted clusters** add etcd backups, control plane HA, and certificate rotation on top of that.

### Cost

Kubernetes rarely reduces infrastructure cost for small workloads — it **redistributes** it:

```
Cost drivers
├── Control plane          (free on managed K8s; not free self-hosted)
├── Worker nodes           (often over-provisioned for headroom)
├── Load balancers         (one per Service type LoadBalancer adds up)
├── Persistent volumes     (block storage per StatefulSet replica)
├── Observability stack    (Prometheus, Grafana, log aggregation)
└── Engineer time          (often the largest line item)
```

A three-container monolith on a single $40/month VM can cost more on a minimum viable AKS/EKS cluster once you account for nodes, LB, and monitoring.

### Configuration and YAML sprawl

- Manifests multiply quickly across environments (dev/staging/prod overlays)
- A "simple" deploy often requires Helm, Kustomize, or a templating layer to stay sane
- Drift between what is in Git and what someone `kubectl edit`ed in prod is a recurring problem without GitOps discipline
- CRDs and operators add power but also **fragmentation** — each tool has its own API and lifecycle

### Networking pain

- Default networking is deceptively simple; production networking (CNI choice, NetworkPolicies, service mesh) is not
- DNS, CoreDNS caching, and headless Services confuse teams early on
- `LoadBalancer` per microservice creates cost and IP sprawl; Ingress adds another component to operate
- Cross-cluster and hybrid networking (on-prem + cloud) remains genuinely difficult

### Stateful workloads

Kubernetes excels at **stateless** services. Databases, queues, and file stores on K8s are doable but contentious:

- PVC binding, storage class portability, and backup/restore are harder than managed DB services
- StatefulSet ordering and pod identity add complexity
- Running Postgres or Kafka yourself means **you** own replication, backups, and disaster recovery

Many teams run stateless apps on K8s and keep state in managed services (RDS, Cloud SQL, Confluent Cloud).

### Security footguns

- RBAC misconfiguration is easy (`cluster-admin` bindings, overly broad Roles)
- Secrets in etcd are base64-encoded by default, not encrypted unless configured
- A compromised pod on a node with a weak NetworkPolicy can reach other pods
- Supply chain risk: pulling `:latest` or unverified images from public registries

Security on K8s is powerful when done well — but **secure by default** it is not.

### Performance and latency

- Scheduler, kubelet, and CNI add layers between your container and the network
- Cold starts and image pulls on new nodes add latency during scale-out
- Not suited for sub-millisecond latency or strict real-time guarantees without careful tuning
- Small, bursty workloads may scale slower than serverless alternatives

### Ecosystem fatigue

The CNCF landscape is vast. Teams face constant decisions:

```
Do we need a service mesh? Which one?
GitOps: Argo CD or Flux?
Ingress: nginx, Traefik, or cloud-native?
Secrets: Sealed Secrets, External Secrets, Vault agent?
Monitoring: Prometheus stack or vendor SaaS?
```

Each choice adds integration work and another system to upgrade and monitor.

### Honest tradeoff summary

| You gain | You pay |
|----------|---------|
| Portability across clouds | Abstraction layers and YAML ceremony |
| Self-healing and rollouts | Controller complexity and async debugging |
| Horizontal scale | Cluster sizing, autoscaling tuning, cost |
| Rich ecosystem | Decision fatigue and integration burden |
| Standard APIs | Still need platform engineering to use well |

Kubernetes is often the right choice at scale or with many services — but it is **overkill** for teams that do not yet feel the pain it was designed to solve.

---

## When NOT to Use Kubernetes

Use the drawbacks above as decision criteria. Kubernetes is a poor default when:

- Single monolith with no scaling or multi-service needs (a PaaS or VM may suffice)
- Team lacks ops capacity for cluster lifecycle (consider managed K8s: [AKS](./AKS.md), EKS, GKE)
- Hard real-time with strict latency guarantees (orchestration adds complexity)
- Short-lived batch jobs only (a job queue or serverless may be simpler)
- Early prototype where deployment speed matters more than portability
- Cost-sensitive small workloads where a single VM or serverless function is cheaper and simpler

---

## Managed vs Self-Hosted

| | **Managed (AKS, EKS, GKE)** | **Self-hosted (kubeadm, kOps)** |
|---|-------------------------------|----------------------------------|
| Control plane | Cloud provider operates | You operate |
| Upgrade burden | Lower | Higher |
| Customization | Some API flags fixed | Full control |
| Best for | Most production workloads | Specialized compliance or edge cases |

---

## Ecosystem

| Tool | Purpose |
|------|---------|
| **kubectl** | CLI for the Kubernetes API |
| **Helm** | Package manager for K8s applications |
| **Kustomize** | Configurable manifest overlays |
| **Argo CD / Flux** | GitOps continuous delivery |
| **Prometheus + Grafana** | Metrics and dashboards |
| **cert-manager** | Automated TLS certificates |
| **Istio / Linkerd** | Service mesh (mTLS, traffic management) |
| **Operators** | Custom controllers for complex apps (CRDs) |

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/quick-reference/)
- [CNCF Landscape](https://landscape.cncf.io/)
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) — deep dive into cluster internals
- [Play with Kubernetes](https://labs.play-with-k8s.com/) — browser-based labs
- Local clusters: [kind](https://kind.sigs.k8s.io/), [minikube](https://minikube.sigs.k8s.io/)

---

## Next Steps

- [ ] Install `kind` or `minikube` and create a local cluster
- [ ] Deploy a multi-replica Deployment with a ClusterIP Service
- [ ] Add liveness and readiness probes; watch endpoints during rollout
- [ ] Practice `kubectl rollout undo` after a bad image update
- [ ] Create a ConfigMap and Secret; mount them into a pod
- [ ] Set up an HPA and generate load to watch it scale
- [ ] Read the [AKS](./AKS.md) entry for Azure-managed deployment patterns
