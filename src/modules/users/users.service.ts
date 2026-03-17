import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Helper } from '../../shared/helpers';
import { BasicService } from '../../shared/services/basic-service.service';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends BasicService<User> {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>, // private jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {
    super(userRepo, 'Users');
  }

  async checkDuplicate(user: Partial<User>) {
    const { email, phoneNumber } = user;
    const isEmailExist = await this.userRepo.findOne({ where: { email } });
    const isTelephoneExist = await this.userRepo.findOne({
      where: { phoneNumber },
    });

    if (isEmailExist && isTelephoneExist) {
      throw new BadRequestException('Email and phone number already exists');
    }

    if (isEmailExist) {
      throw new BadRequestException('Email exists');
    }

    if (isTelephoneExist) {
      throw new BadRequestException('Phone number exists');
    }
  }

  async create(createUserDto: CreateUserDto) {
    let { password } = createUserDto;

    await this.checkDuplicate(createUserDto);

    if (!password) {
      password = Helper.randPassword(3, 2, 6);
    }

    const response = this.userRepo.create({ ...createUserDto, password });

    const user = await this.userRepo.save(response);
    return user;
  }

  // async assignRole(assignRoleDto: AssignRoleDto) {
  //   const { userId, roleId } = assignRoleDto;
  //   const user = await this.findOne(userId);
  //   const role = await this.rolesService.findOne(roleId);
  //   user.role = role;
  //   await user.save();
  //   return user;
  // }
}
