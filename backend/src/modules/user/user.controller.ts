import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { getErrorMessage, parseUpdateProfileBody } from './user.controller.helpers.js';

const ERROR_GET_PROFILE = 'Error al obtener el perfil';
const ERROR_UPDATE_PROFILE = 'Error al actualizar el perfil';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const profile = await this.userService.getProfile(userId);

      res.status(200).json(profile);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 404 : 500).json({
        error: getErrorMessage(error, ERROR_GET_PROFILE),
      });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const data = parseUpdateProfileBody(req.body);
      const profile = await this.userService.updateProfile(userId, data);

      res.status(200).json(profile);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: getErrorMessage(error, ERROR_UPDATE_PROFILE),
      });
    }
  };
}
