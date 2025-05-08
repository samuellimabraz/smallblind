import { ModelMetadata } from '../data-models/ModelMetadata';
import { ModelRegistry } from './ModelRegistry';

export interface SelectionRule {
    task: string;
    priority: number;
    evaluate: (model: ModelMetadata, constraints?: any) => number;
}

/**
 * Router for selecting the best model for a task
 */
export class ModelRouter {
    private modelRegistry: ModelRegistry;
    private selectionRules: Map<string, SelectionRule[]>;

    constructor(modelRegistry: ModelRegistry) {
        this.modelRegistry = modelRegistry;
        this.selectionRules = new Map<string, SelectionRule[]>();

        // Add default selection rules
        this.addDefaultSelectionRules();
    }

    /**
     * Get the best model for a task
     * @param task Task name
     * @param constraints Constraints for model selection
     */
    public async getModelForTask(task: string, constraints?: any): Promise<ModelMetadata | null> {
        // Get all models that can perform this task
        const candidates = await this.modelRegistry.listModels({ tasks: [task] });

        if (candidates.length === 0) {
            return null;
        }

        // Rank models using selection rules
        const ranked = this.rankModels(candidates, constraints);

        // Return the best model
        return ranked.length > 0 ? ranked[0] : null;
    }

    /**
     * Add a selection rule
     * @param rule Selection rule
     */
    public addSelectionRule(rule: SelectionRule): void {
        if (!this.selectionRules.has(rule.task)) {
            this.selectionRules.set(rule.task, []);
        }

        this.selectionRules.get(rule.task)!.push(rule);

        // Sort rules by priority (higher first)
        this.selectionRules.get(rule.task)!.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Remove a selection rule
     * @param task Task name
     * @param priority Rule priority (to identify which rule to remove)
     */
    public removeSelectionRule(task: string, priority: number): boolean {
        if (!this.selectionRules.has(task)) {
            return false;
        }

        const rules = this.selectionRules.get(task)!;
        const initialLength = rules.length;

        this.selectionRules.set(
            task,
            rules.filter(rule => rule.priority !== priority)
        );

        return initialLength !== this.selectionRules.get(task)!.length;
    }

    /**
     * Evaluate a model against constraints
     * @param model Model to evaluate
     * @param constraints Constraints to evaluate against
     */
    private evaluateModel(model: ModelMetadata, constraints?: any): number {
        if (!constraints) {
            return 1;
        }

        let score = 1.0;

        // Apply task-specific rules
        if (model.tasks.length > 0 && this.selectionRules.has(model.tasks[0])) {
            for (const rule of this.selectionRules.get(model.tasks[0])!) {
                score *= rule.evaluate(model, constraints);
            }
        }

        // Apply generic constraints
        if (constraints.maxSize && model.size > constraints.maxSize) {
            score *= 0.5;
        }

        if (constraints.preferQuantized && model.quantized) {
            score *= 1.2;
        }

        if (constraints.preferUnquantized && !model.quantized) {
            score *= 1.2;
        }

        return score;
    }

    /**
     * Rank models according to constraints
     * @param candidates Candidate models
     * @param constraints Constraints to evaluate against
     */
    private rankModels(candidates: ModelMetadata[], constraints?: any): ModelMetadata[] {
        // Evaluate each model and sort by score (descending)
        return [...candidates].sort((a, b) => {
            return this.evaluateModel(b, constraints) - this.evaluateModel(a, constraints);
        });
    }

    /**
     * Add default selection rules
     */
    private addDefaultSelectionRules(): void {
        // Example rule: Prefer smaller models on mobile devices
        this.addSelectionRule({
            task: 'image-captioning',
            priority: 100,
            evaluate: (model, constraints) => {
                if (constraints?.deviceType === 'mobile' && model.size < 100 * 1024 * 1024) {
                    return 2.0;
                }
                return 1.0;
            }
        });

        // Example rule: Prefer faster models for real-time tasks
        this.addSelectionRule({
            task: 'object-detection',
            priority: 100,
            evaluate: (model, constraints) => {
                if (constraints?.realTime && model.name.includes('Tiny')) {
                    return 3.0;
                }
                return 1.0;
            }
        });

        // Add more default rules as needed
    }
} 