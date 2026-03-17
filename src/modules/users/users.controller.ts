import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { resolveResponse } from '../../shared/resolvers';

@ApiTags('Users')
@ApiBearerAuth()
// @UseGuards(AuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Permissions('user.create')
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return resolveResponse(
      this.usersService.create(createUserDto),
      'Account Created',
    );
  }

  // @Post('assign-role')
  // async assignRole(@Body() assignRoleDto: AssignRoleDto) {
  //   return resolveResponse(
  //     this.usersService.assignRole(assignRoleDto),
  //     'Role Assigned',
  //   );
  // }
}
