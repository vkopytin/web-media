import { ErrorWithStatus } from './errorWithStatus';

export const resultOrError = async <T,>(response: Response): Promise<T> => {
    if ([200, 202, 204].indexOf(response.status) !== -1) {
        const text = await response.text();
        if (!text) {
            return text as T;
        }
        try {
            return JSON.parse(text);
        } catch (ex) {
            return text as T;
        }
    } else if (response.status > 200 && response.status < 300) {
        return undefined as T;
    } else {
        const result = await response.text();
        const res = JSON.parse(result);

        if (!(typeof (res) === 'object' && 'error' in res)) {
            throw new ErrorWithStatus(result, response.status, response.statusText);
        }

        const error = res.error;
        if (!(typeof (error) === 'object' && 'message' in error)) {
            throw new ErrorWithStatus(error, response.status, response.statusText);
        }

        throw new ErrorWithStatus(error.message, response.status, response.statusText, res);
    }
}
