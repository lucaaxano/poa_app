import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.usersService.findByCompanyId(req.user.companyId!);
  }

  // Specific routes MUST come before parameterized routes
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Prevent changing own role
    if (id === req.user.id) {
      throw new ForbiddenException('Sie koennen Ihre eigene Rolle nicht aendern');
    }
    return this.usersService.updateRole(id, req.user.companyId!, updateRoleDto.role);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async deactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    // Prevent deactivating self
    if (id === req.user.id) {
      throw new ForbiddenException('Sie koennen sich nicht selbst deaktivieren');
    }
    return this.usersService.deactivate(id, req.user.companyId!);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async reactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.usersService.reactivate(id, req.user.companyId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.usersService.findByIdAndCompany(id, req.user.companyId!);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, req.user.companyId!, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    // Prevent deleting self
    if (id === req.user.id) {
      throw new ForbiddenException('Sie koennen sich nicht selbst loeschen');
    }
    await this.usersService.delete(id, req.user.companyId!);
    return { success: true };
  }
}
