import { ProviderName } from "@/types";

export const INTENTION_MODEL: string = "phi4";
export const INTENTION_TEMPERATURE: number = 0.7;

export const FEEDBACK_RESPONSE_PROVIDER: ProviderName = "openai";
export const FEEDBACK_RESPONSE_MODEL: string = "deepseek-r1:32b";
export const FEEDBACK_RESPONSE_TEMPERATURE: number = 0.6;

export const RANDOM_RESPONSE_PROVIDER: ProviderName = "openai";
export const RANDOM_RESPONSE_MODEL: string = "deepseek-r1:32b";
export const RANDOM_RESPONSE_TEMPERATURE: number = 0.25;

export const HOSTILE_RESPONSE_PROVIDER: ProviderName = "openai";
export const HOSTILE_RESPONSE_MODEL: string = "deepseek-r1:32b";
export const HOSTILE_RESPONSE_TEMPERATURE: number = 0.25;

export const QUESTION_RESPONSE_PROVIDER: ProviderName = "openai";
export const QUESTION_RESPONSE_MODEL: string = "deepseek-r1:32b";
export const QUESTION_RESPONSE_TEMPERATURE: number = 0.25;

export const HYDE_MODEL: string = "phi4";
export const HYDE_TEMPERATURE: number = 0.7;
