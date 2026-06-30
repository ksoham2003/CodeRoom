const errorHandler = (err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	const errorMessage = err.message || "Internal Server Error";

	if (statusCode >= 500) {
		console.error(err);
	}

	res.status(statusCode).json({
		statusCode,
		message: errorMessage,
		errors: err.errors || [],
	});
};

export default errorHandler;
