declare module 'mathjax' {
  const MathJax: {
    init(config?: unknown): Promise<unknown>;
  };

  export default MathJax;
}
