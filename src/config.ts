import type { Config } from './types';

export const createConfig = <const C extends Config>(config: C) => config;
