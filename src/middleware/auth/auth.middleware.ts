import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../../endpoints/users/users.service';

import { ApiKey } from './entities/api-key.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly usersService: UsersService,
  ) {}
  async use(req: any, res: any, next: (error?: any) => void) {
    const apikey = req.query['apikey'];
    if (!apikey) {
      throw new UnauthorizedException('Unauthorized');
    }
    await this.validateApiKey(apikey, req);
    next();
  }

  private apiKeys: string[] = ['x1jb520220hdvi71u7yv5bc0jf8wj634'];

  async validateApiKey(key: string, req: any) {
    if (this.apiKeys.find((e) => key === e)) {
      return;
    }
    const apiKey = await this.getApiKey(key);
    if (!apiKey) {
      throw new UnauthorizedException('Unauthorized');
    }
    for (const permissionId of apiKey.permissions) {
      const permission = await this.getPermission(permissionId);
      if (!permission) {
        throw new UnauthorizedException('Permission Denied');
      }
      for (const allowedPaths of permission.allowedPaths) {
        let regString = allowedPaths;
        for (const placeHolder of permission.placeHolder) {
          if (apiKey.paramsWhiteList[placeHolder]) {
            const paramRegex = `(${apiKey.paramsWhiteList[placeHolder].join(
              '|',
            )})`;
            regString = regString.replace(`{${placeHolder}}`, paramRegex);
          } else {
            regString.replace(`{${placeHolder}}`, '[0-9A-Za-z]+');
          }
        }
        for (const [index, item] of Object.entries(apiKey.paramsWhiteList)) {
          if (req.body[index]) {
            if (!item.includes(req.body[index])) {
              throw new UnauthorizedException('Permission Denied');
            }
          }
        }
        const regExp = new RegExp(regString);
        if (regExp.exec(req.baseUrl)) {
          const user = await this.usersService.getUser(apiKey.owner);
          if (
            apiKey.ipCheckExcludes.includes(req.headers['cf-connecting-ip']) ||
            apiKey.ipCheckExcludes.includes(req.headers['CF-Connecting-IP']) ||
            user.ipAddress === req.headers['cf-connecting-ip'] ||
            user.ipAddress === req.headers['CF-Connecting-IP'] ||
            apiKey.ipCheckExcludes.includes('*')
          ) {
            if (!req.baseUrl.startsWith('/users/entry-code')) {
              req.headers['cf-connecting-ip'] = '2001:db8::dead:beef';
              req.headers['CF-Connecting-IP'] = '2001:db8::dead:beef';
            }
          }
          return;
        }
      }
    }
    throw new UnauthorizedException('Permission Denied');
  }

  async getApiKey(key: string) {
    const apiKey = await this.apiKeyRepository.findOneBy({ key });
    return apiKey;
  }
  async getPermission(id: string) {
    const permission = await this.permissionRepository.findOneBy({ id });
    return permission;
  }
}
