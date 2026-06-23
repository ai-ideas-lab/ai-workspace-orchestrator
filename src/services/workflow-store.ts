import { randomUUID } from "node:crypto";
import { WorkflowDefinition, WorkflowStep } from "./workflow-executor.js";

export interface StoredWorkflow extends WorkflowDefinition {
  description?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInput {
  name: string;
  description?: string;
  status?: StoredWorkflow["status"];
  steps: WorkflowStep[];
  defaultPriority?: WorkflowDefinition["defaultPriority"];
}

export class WorkflowStore {
  private readonly workflows = new Map<string, StoredWorkflow>();

  list(): StoredWorkflow[] {
    return [...this.workflows.values()].map((workflow) => this.copy(workflow));
  }

  get(id: string): StoredWorkflow | undefined {
    const workflow = this.workflows.get(id);
    return workflow ? this.copy(workflow) : undefined;
  }

  create(input: WorkflowInput): StoredWorkflow {
    const now = new Date();
    const workflow: StoredWorkflow = {
      id: randomUUID(),
      name: input.name.trim(),
      steps: structuredClone(input.steps),
      status: input.status ?? "DRAFT",
      createdAt: now,
      updatedAt: now,
      ...(input.description ? { description: input.description } : {}),
      ...(input.defaultPriority ? { defaultPriority: input.defaultPriority } : {}),
    };
    this.workflows.set(workflow.id, workflow);
    return this.copy(workflow);
  }

  update(id: string, input: Partial<WorkflowInput>): StoredWorkflow | undefined {
    const existing = this.workflows.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: StoredWorkflow = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.steps !== undefined ? { steps: structuredClone(input.steps) } : {}),
      ...(input.defaultPriority !== undefined
        ? { defaultPriority: input.defaultPriority }
        : {}),
      updatedAt: new Date(),
    };
    this.workflows.set(id, updated);
    return this.copy(updated);
  }

  delete(id: string): boolean {
    return this.workflows.delete(id);
  }

  clone(id: string, name?: string): StoredWorkflow | undefined {
    const source = this.workflows.get(id);
    if (!source) {
      return undefined;
    }
    const input: WorkflowInput = {
      name: name?.trim() || `${source.name} (copy)`,
      status: "DRAFT",
      steps: source.steps,
      ...(source.description !== undefined ? { description: source.description } : {}),
      ...(source.defaultPriority !== undefined
        ? { defaultPriority: source.defaultPriority }
        : {}),
    };
    return this.create(input);
  }

  clear(): void {
    this.workflows.clear();
  }

  private copy(workflow: StoredWorkflow): StoredWorkflow {
    return structuredClone(workflow);
  }
}
