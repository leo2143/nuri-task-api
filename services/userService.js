import User from '../models/userModel.js';
import { ResponseModel, NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import chalk from 'chalk';

export class UserService { 

    static async getAllUsers() {
        try {
            const users = await User.find().select('-password');
            if (!users) {
                return new NotFoundResponseModel('No se encontraron usuarios en la base de datos');
            }
            return new SuccessResponseModel(users, users.length, 'Usuarios obtenidos correctamente');
        } catch (error) {
            console.error(chalk.red('Error al obtener usuarios:', error));
            return new ErrorResponseModel('Error al obtener usuarios');           
        }
    }

    static async getUserById(id) {
        try {
        const user = await User.findById(id).select('-password');
            if (!user) {
                return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
            }
            return new SuccessResponseModel(user, 1, 'Usuario obtenido correctamente');
        } catch (error) {
            console.error(chalk.red('Error al obtener usuario:', error));
            return new ErrorResponseModel('Error al obtener usuario');           
        }
    }

    static async createUser(userData) {
        try {
            const user = new User(userData);
            const savedUser = await user.save();
            return new CreatedResponseModel({
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }, 'Usuario creado correctamente');
        } catch (error) {
            console.error(chalk.red('Error al crear el usuario:', error));
            return new ErrorResponseModel('Error al crear usuario');           
        }
    }

    static async updateUser(id, userData) {
        try {
            const user = await User.findByIdAndUpdate(id, userData, { new: true });
            if (!user) {
                return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
            }
            return new SuccessResponseModel(user, 1, 'Usuario actualizado correctamente');
        } catch (error) {
            console.error(chalk.red('Error al actualizar usuario:', error));
            return new ErrorResponseModel('Error al actualizar usuario');           
        }
    }

    static async deleteUser(id) {
        try {
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                    return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
            }
            return new SuccessResponseModel(user, 1, 'Usuario eliminado correctamente');
        } catch (error) {
            console.error(chalk.red('Error al eliminar usuario:', error));
            return new ErrorResponseModel('Error al eliminar usuario');           
        }
    }
}
