export function asyncHandler(work) {
  return (req, res, next) => {
    Promise.resolve(work(req, res, next)).catch(next);
  };
}
