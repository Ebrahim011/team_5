import { AxiosError } from 'axios';

export const extractErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        // Network errors (no response from server)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
            return 'خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت أو تأكد من أن الخادم يعمل.';
        }

        // Check if server sent a specific error message
        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        // Check for specific status codes
        if (error.response?.status === 400) {
            return 'بيانات غير صالحة. يرجى التحقق من المدخلات.';
        }
        if (error.response?.status === 401) {
            return 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.';
        }
        if (error.response?.status === 403) {
            return 'ليس لديك صلاحية للقيام بهذا الإجراء.';
        }
        if (error.response?.status === 404) {
            return 'المورد غير موجود.';
        }
        if (error.response?.status === 500) {
            return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
        }
    }

    if (error instanceof Error) {
        // Handle network-related error messages
        if (error.message.includes('Network') || error.message.includes('network')) {
            return 'خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.';
        }
        return error.message;
    }

    return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
};

export const extractFormErrors = (error: unknown): Record<string, string> => {
    const formErrors: Record<string, string> = {};

    if (error instanceof AxiosError) {
        // Handle validation errors from express-validator backend
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            error.response.data.errors.forEach((err: { field: string; message: string }) => {
                if (err.field && err.message) {
                    formErrors[err.field] = err.message;
                }
            });
        }
    }

    // If no specific field errors were found, or just to provide a summary
    // we also populate the general error message
    // If the error is generic (not validation), this will be the only error.
    formErrors.general = extractErrorMessage(error);

    return formErrors;
};
