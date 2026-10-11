import { RegisterBody, LoginBody, VerifyOtpBody, ForgotPasswordBody, ResetPasswordBody } from '@mtbs/shared-schemas';
import { http, unwrap } from './client';

export const register = (body) => http.post('/auth/register', RegisterBody.parse(body)).then(unwrap); // { userId, otpSent }
export const verifyOtp = (body) => http.post('/auth/verify-otp', VerifyOtpBody.parse(body)).then(unwrap); // { verified }
export const resendOtp = (userId) => http.post('/auth/resend-otp', { userId }).then(unwrap); // { otpSent }
export const login = (body) => http.post('/auth/login', LoginBody.parse(body)).then(unwrap); // { accessToken, user }
export const logout = () => http.post('/auth/logout').then(() => null); // 204
export const forgotPassword = (body) => http.post('/auth/forgot-password', ForgotPasswordBody.parse(body)).then(unwrap);
export const resetPassword = (body) => http.post('/auth/reset-password', ResetPasswordBody.parse(body)).then(unwrap);
export const getMe = () => http.get('/auth/me').then(unwrap).then((d) => d.user);
