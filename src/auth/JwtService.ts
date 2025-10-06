import * as jwt from 'jsonwebtoken';

export type UserRole = 'USER' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private readonly secret = process.env.JWT_SECRET || 'a_very_secret_key';

  sign(userId: string, role: UserRole): string {
    const payload: JwtPayload = { sub: userId, role };
    return jwt.sign(payload, this.secret, { expiresIn: '30d' });
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}
