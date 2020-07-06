import { Controller, Post, Body, Delete, Put, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CreateArticleDto as CreateDto } from './dto/create.dto';
import { ObjectID } from 'mongodb';
import { MyHttpException } from '../../core/exception/my-http.exception';
import { ErrorCode } from '../../constants/error';
import { Roles } from '../../core/decorators/roles.decorator';
import { ActiveGuard } from '../../core/guards/active.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { User } from '../../models/user.entity';
import { ApiBearerAuth, ApiTags, ApiParam } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CurUser } from '../../core/decorators/user.decorator';
import { ArticleListDto } from './dto/list.dto';
import { ChangeArticleStatus } from './dto/status.dto';
import { ArticleStatus } from '../../models/article.entity';
import { NotifyService } from '../../common/notify.service';
import { NotifyType } from 'src/models/notify.entiy';

@Controller('article')
@ApiTags('文章')
export class ArticleController {

  constructor(
    private readonly articleService: ArticleService,
    private readonly notifyService: NotifyService,
  ) { }

  @Get('list/hot')
  async hotList () {
    return this.articleService.pageHotList();
  }

  @Get('list/all')
  async pageList (@Query() ListDto: ArticleListDto) {
    return this.articleService.pageList(ListDto, ArticleStatus.VerifySuccess);
  }

  @Get('list')
  @ApiBearerAuth()
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles('ArticleList')
  async list (@Query() ListDto: ArticleListDto) {
    return this.articleService.pageList(ListDto);
  }

  @Post()
  @UseGuards(ActiveGuard)
  @ApiBearerAuth()
  async created (@Body() createDto: CreateDto, @CurUser() user: User) {
    return this.articleService.create(createDto, user._id);
  }

  @Put(':id/like')
  @UseGuards(ActiveGuard)
  // @Roles(UserRole.Normal, UserRole.Editor, UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth()
  async like (@Param('id') id: string, @CurUser() user: User) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE });
    const oid = new ObjectID(id);
    const currentArticle = await this.articleService.findBasisById(id);
    const hasLike = await this.articleService.hashLikeByUid(oid, user._id);

    if (hasLike) {
      await this.articleService.unlikeById(oid, user._id);
    } else {
      await this.articleService.likeById(oid, user._id);
      await this.notifyService.publish(NotifyType.articlelike, user._id, currentArticle.user as ObjectID, '点赞了你的文章', oid);
    }
    return "成功";
  }

  @Delete(':id')
  @UseGuards(ActiveGuard)
  @ApiBearerAuth()
  async deleted (@Param('id') id: string) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE })
    return this.articleService.deleteById(id);
  }

  @Put(':id')
  @UseGuards(ActiveGuard)
  // @Roles(UserRole.Normal, UserRole.Editor, UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth()
  async updated (@Param('id') id: string, @Body() createDto: CreateDto) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE });
    return this.articleService.updateById(id, createDto);
  }

  @Get(':id')
  async get (@Param('id') id: string) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE });
    const _id = new ObjectID(id);
    this.articleService.addViewCount(_id);
    return this.articleService.findById(id);
  }

  @Get(':id/basis')
  @UseGuards(ActiveGuard)
  @ApiBearerAuth()
  async basis (@Param('id') id: string) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE })
    return this.articleService.findBasisById(id);
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles('ChangeArticleStatus')
  // @Roles(UserRole.Editor, UserRole.Admin, UserRole.SuperAdmin)
  async changeStatus (@Param('id') id: string, @Body() body: ChangeArticleStatus) {
    if (!ObjectID.isValid(id)) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE });
    return this.articleService.changeStatus(id, body.status);
  }
}
