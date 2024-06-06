import { ChatCompletionsProgressReport, GenerationProgress } from "genaiscript-core";

export class SpinnerGenerationProgress implements GenerationProgress {
    name: string;
    id: string;
    log(text: string): void {
        throw new Error("Method not implemented.");
    }
    completion(value: ChatCompletionsProgressReport): void {
        throw new Error("Method not implemented.");
    }

}