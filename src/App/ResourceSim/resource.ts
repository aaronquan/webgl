

export const ResourceEnum = {
  Water: 0,
  Apple: 1,
} as const;

export type Resource = (typeof ResourceEnum)[keyof typeof ResourceEnum];