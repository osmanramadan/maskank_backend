declare global {
  interface Error {
    statusCode?: number;
    code?: string;
  }
}

export {};
