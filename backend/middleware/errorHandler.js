
function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Invalid JSON request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  // Request body too large
  if (err.status === 413) {
    return res.status(413).json({
      message: "Request body is too large"
    });
  }

  // Prisma unique constraint
  if (err.code === "P2002") {
    return res.status(409).json({
      message: "A record with this value already exists"
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      message: "Requested record not found"
    });
  }

  // Prisma foreign key constraint
  if (err.code === "P2003") {
    return res.status(409).json({
      message: "This operation conflicts with a related record"
    });
  }

  // Unexpected error
  return res.status(500).json({
    message: "An unexpected server error occurred"
  });
}

module.exports = errorHandler;
