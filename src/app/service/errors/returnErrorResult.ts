import { ErrorWithStatus } from '../../adapter/errors/errorWithStatus';
import { NoActiveDeviceError } from './noActiveDeviceError';
import { MediaServiceError } from './mediaServiceError';
import { MediaServiceUnexpectedError } from './mediaServiceUnexpectedError';
import { TokenExpiredError } from './tokenExpiredError';
import { UnauthenticatedError } from './unauthenticatedError';
import { Result } from '../../utils/result';

export function returnErrorResult<T>(message: string, err: Error): Result<Error, T> {
    if (err instanceof ErrorWithStatus) {
        if (err.status === 401 && /expired/i.test(err.message)) {
            return TokenExpiredError.of(err.message, err);
        } else if (err.status === 404 && /active device/i.test(err.message)) {
            return NoActiveDeviceError.of(err.message, err);
        } else if (err.status === 400 && /bearer authentication/i.test(err.message)) {
            return UnauthenticatedError.of(err.message, err);
        }

        return MediaServiceError.of<T>(err.message, err);
    }

    return MediaServiceUnexpectedError.of<T>(message, err);
}
