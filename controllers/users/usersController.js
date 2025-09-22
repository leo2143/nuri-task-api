import { UserService } from '../../services/userService.js';

export class UsersController {

    static async createUser(req, res) {
        const userData = req.body;
        const user = await UserService.createUser(userData);
        res.json(user); 

    }
    
    static async updateUser(req, res) {
        const id = req.params.id;
        const userData = req.body;
        const user = await UserService.updateUser(id, userData);
        res.json(user);
    }
 
    static async getAllUsers(req, res) {
        const users = await UserService.getAllUsers();
        res.json(users);
    }

    static async getUserById(req, res) {
        const id = req.params.id;
        const user = await UserService.getUserById(id);
        res.json(user);
    }


    static async deleteUser(req, res) {
        const id = req.params.id;
        const user = await UserService.deleteUser(id);
        res.json(user);
    }
 }