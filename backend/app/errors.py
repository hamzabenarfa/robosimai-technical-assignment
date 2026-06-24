from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(HTTPException):
    """HTTPException carrying a stable machine-readable error code."""

    def __init__(self, status_code: int, detail: str, code: str) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


class SceneNotFound(AppError):
    def __init__(self) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "Scene not found", "SCENE_NOT_FOUND")


class ObjectNotFound(AppError):
    def __init__(self) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "Object not found", "OBJECT_NOT_FOUND")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        code = getattr(exc, "code", None) or f"HTTP_{exc.status_code}"
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail), "code": code},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "code": "VALIDATION_ERROR",
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "code": "INTERNAL_ERROR"},
        )
