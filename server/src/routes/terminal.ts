import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateSystemPrompt, isAvailable } from '../services/ollama';
import { getProjectContext } from '../services/project-scanner';
import { createSession, getSession } from '../session-store';

const router = Router();

router.post('/start', async (req: Request, res: Response) => {
  const { projectId, serviceDirectory, goal } = req.body as {
    projectId: string;
    serviceDirectory: string;
    goal: string;
  };

  if (!projectId || !serviceDirectory || !goal) {
    res.status(400).json({ error: 'projectId, serviceDirectory, and goal are required' });
    return;
  }

  const projectContext = getProjectContext(serviceDirectory);
  const ollamaUp = await isAvailable();

  let systemPrompt: string;
  if (ollamaUp) {
    systemPrompt = await generateSystemPrompt(goal, projectContext);
  } else {
    systemPrompt = `You are an expert software development assistant. The user is working on a project at: ${serviceDirectory}

Goal for this session: ${goal}

Project context:
${projectContext}

Provide clear, actionable, and accurate assistance.`;
  }

  const sessionId = uuidv4();
  createSession({
    id: sessionId,
    projectId,
    serviceDirectory,
    goal,
    systemPrompt,
    claudeMessages: [],
    rawLog: [],
    createdAt: Date.now(),
  });

  res.json({ sessionId, systemPrompt, ollamaAvailable: ollamaUp });
});

router.get('/:id/history', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({
    goal: session.goal,
    systemPrompt: session.systemPrompt,
    rawLog: session.rawLog,
    messageCount: session.claudeMessages.length,
  });
});

export default router;
