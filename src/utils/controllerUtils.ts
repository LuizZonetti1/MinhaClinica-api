import type { Response } from "express";

export const handleControllerError = (
    res: Response,
    error: unknown,
    fallbackMessage: string,
    defaultStatus = 400,
): void => {
    if (error instanceof Error) {
        const statusCode =
            "statusCode" in error
                ? (error as Error & { statusCode: number }).statusCode
                : defaultStatus;
        res.status(statusCode).json({ error: error.message });
    } else {
        res.status(500).json({ error: fallbackMessage });
    }
};
