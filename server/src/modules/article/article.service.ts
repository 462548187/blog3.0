import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { Article, ArticleStatus } from '../../models/article.entity';
import { Tag } from '../../models/tag.entity';
import { InjectModel } from 'nestjs-typegoose';
import { CreateArticleDto as CreateDto } from './dto/create.dto';
import { ObjectID } from 'mongodb';
import { ArticleListDto } from './dto/list.dto';
import { Comment } from '../../models/comment.entity';
import { MyHttpException } from '../../core/exception/my-http.exception';
import { ErrorCode } from '../../constants/error';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article)
    private readonly articleSchema: ReturnModelType<typeof Article>,
    @InjectModel(Tag)
    private readonly tagSchema: ReturnModelType<typeof Tag>,
    @InjectModel(Comment)
    private readonly commentSchema: ReturnModelType<typeof Comment>,
  ) { }

  // 创建
  async create(createDto: CreateDto, userId: ObjectID) {
    const or = createDto.tags.map(id => ({ _id: new ObjectID(id) }))
    let tags = [];
    if (or.length) {
      // 只选有用的tag
      tags = (await this.tagSchema.find({ $or: or })).map(item => item._id);
    }
    const article = new Article();
    article.htmlContent = createDto.htmlContent;
    article.title = createDto.title;
    article.summary = createDto.htmlContent.substring(0, 150);

    article.coverURL = createDto.coverURL || null;

    article.tags = tags;
    article.user = userId;
    article.status = 1;
    article.wordCount = createDto.htmlContent.replace(/[\s\n\r\t\f\v]+/g, '').length;
    return this.articleSchema.create(article);
  }

  async changeStatus(id: string, status: ArticleStatus = 1) {
    return this.articleSchema.findByIdAndUpdate(id, { $set: { status } })
  }

  async deleteById(id: string) {
    return this.articleSchema.deleteOne({ _id: id });
  }

  async updateById(id: string, createDto: CreateDto) {
    const article = await this.articleSchema.findById(id);
    if (!article) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE })
    const htmlContent = createDto.htmlContent || article.htmlContent;
    const title = createDto.title || article.title;
    const coverURL = createDto.coverURL || article.coverURL;
    return this.articleSchema.updateOne({ _id: id }, {
      $set: {
        htmlContent,
        summary: htmlContent.substring(0, 150),
        title,
        coverURL,
        updatedAt: Date.now()
      }
    });
  }

  async findById(id: string) {
    return await this.articleSchema
      .findById(id)
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
  }

  async addViewCount(id: string) {
    this.articleSchema.updateOne({ _id: id }, { $inc: { browseCount: 1 } })
    return;
  }

  async pageList(listDto: ArticleListDto) {
    const where: any = {
    };
    const whereOrKeys = ['title', 'summary'];
    if (listDto.keyword) {
      const rx = new RegExp(listDto.keyword);
      where.$or = whereOrKeys.map(key => ({ [key]: rx }))
    }
    const page_index = Number(listDto.page_index || 1) - 1;
    const page_size = Number(listDto.page_size || 10);

    const a_list = await this.articleSchema
      .find(where, '-htmlContent')
      .sort({ _id: -1 })
      .skip(page_index * page_size)
      .limit(page_size)
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
      .exec();

    const list_p = a_list.map(async item => {
      item = item.toJSON();
      item.commentCount = await this.commentSchema.countDocuments({ article: item._id });
      return item;
    });
    // commentSchema

    const list = await Promise.all(list_p);

    const total = await this.articleSchema.countDocuments(where);

    return {
      list,
      total
    }
  }

  async pageHotList() {

    const a_list = await this.articleSchema
      .find({ coverURL: { $ne: null } }, '-htmlContent')
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
      .sort({ browseCount: -1 })
      .limit(6)
      .exec();

    const list_p = a_list.map(async item => {
      item = item.toJSON();
      item.commentCount = await this.commentSchema.countDocuments({ article: item._id });
      return item;
    });

    const list = await Promise.all(list_p);

    const total = await this.articleSchema.countDocuments();

    return {
      list,
      total
    }
  }
}
