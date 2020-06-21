import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { Article, ArticleStatus } from '../../models/article.entity';
import { Tag } from '../../models/tag.entity';
import { InjectModel } from 'nestjs-typegoose';
import { CreateArticleDto as CreateDto } from './dto/create.dto';
import { ObjectID } from 'mongodb';
import { ArticleListDto } from './dto/list.dto';
import { ArticleListByTagDto } from './dto/listByTag.dto';

import { Comment, ArticleComment } from '../../models/comment.entity';
import { MyHttpException } from '../../core/exception/my-http.exception';
import { ErrorCode } from '../../constants/error';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article)
    private readonly articleSchema: ReturnModelType<typeof Article>,
    @InjectModel(Tag)
    private readonly tagSchema: ReturnModelType<typeof Tag>,
    @InjectModel(ArticleComment)
    private readonly commentSchema: ReturnModelType<typeof ArticleComment>,
  ) { }

  // 创建
  async create (createDto: CreateDto, userId: ObjectID) {
    const or = createDto.tags.map(id => ({ _id: new ObjectID(id) }))
    let tags = [];
    if (or.length) {
      // 只选有用的tag
      tags = (await this.tagSchema.find({ $or: or })).map(item => item._id);
    }
    const article = new Article();
    // article.htmlContent = createDto.htmlContent;
    article.content = createDto.content;
    article.title = createDto.title;
    article.summary = createDto.summary || '';

    article.coverURL = createDto.coverURL || null;

    article.tags = tags;
    article.user = userId;
    article.status = 1;
    article.wordCount = createDto.content.replace(/[\s\n\r\t\f\v]+/g, '').length;
    return this.articleSchema.create(article);
  }

  async changeStatus (id: string, status: ArticleStatus = 1) {
    return this.articleSchema.findByIdAndUpdate(id, { $set: { status } })
  }

  async deleteById (id: string) {
    return this.articleSchema.deleteOne({ _id: id });
  }

  async updateById (id: string, createDto: CreateDto) {
    const article = await this.articleSchema.findById(id);
    if (!article) throw new MyHttpException({ code: ErrorCode.ParamsError.CODE })
    // const htmlContent = createDto.htmlContent || article.htmlContent;
    const title = createDto.title || article.title;
    const coverURL = createDto.coverURL || article.coverURL;
    const summary = createDto.summary || article.summary;
    const content = createDto.content || article.content;
    const _tag = createDto.tags ? createDto.tags.map(item => new ObjectID(item)) : null;
    const tags: any = _tag || article.tags;
    return this.articleSchema.updateOne({ _id: id }, {
      $set: {
        // htmlContent,
        summary,
        title,
        coverURL,
        content,
        tags,
        updatedAt: Date.now()
      }
    });
  }

  async findById (id: string) {
    return await this.articleSchema
      .findById(id)
      .select('-htmlContent')
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
  }
  async findBasisById (id: string) {
    return await this.articleSchema
      .findById(id).exec();
  }

  async addViewCount (id: ObjectID) {
    return await this.articleSchema.updateOne({ _id: id }, { $inc: { browseCount: 1 } })
  }

  async pageListByTag (tagId: ObjectID, listDto: ArticleListByTagDto) {

    const page_index = Number(listDto.page_index || 1) - 1;
    const page_size = Number(listDto.page_size || 10);
    const where = {
      tags: { $elemMatch: { $eq: tagId } }
    };
    const a_list = await this.articleSchema
      .find(where, '-htmlContent -content')
      .sort({ _id: -1 })
      .skip(page_index * page_size)
      .limit(page_size)
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }]);
    const list_p = a_list.map(async item => {
      item = item.toJSON();
      item.commentCount = await this.commentSchema.countDocuments({ sourceID: item._id });
      return item;
    });
    const list = await Promise.all(list_p);
    const total = await this.articleSchema.countDocuments(where);
    return {
      list,
      total
    }
  }

  async pageList (listDto: ArticleListDto) {
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
      .find(where, '-htmlContent -content')
      .sort({ _id: -1 })
      .skip(page_index * page_size)
      .limit(page_size)
      .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
      .exec();

    const list_p = a_list.map(async item => {
      item = item.toJSON();
      item.commentCount = await this.commentSchema.countDocuments({ sourceID: item._id });
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

  async pageHotList () {

    const a_list = await this.articleSchema
      .find({ coverURL: { $ne: null } }, '-htmlContent -content')
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

  async listByUserId (id: ObjectID | string) {
    const a_list = await this.articleSchema
      .find({ user: id }, '-htmlContent -content')
      .sort({ _id: -1 })
      // .populate([{ path: 'user', select: "-pass" }])
      .populate([{ path: 'tags' }])
      .exec();

    const list_p = a_list.map(async item => {
      item = item.toJSON();
      item.commentCount = await this.commentSchema.countDocuments({ sourceID: item._id });
      return item;
    });

    const list = await Promise.all(list_p);
    return list;
  }

  async statistics (id: ObjectID) {
    const data = await this.articleSchema.aggregate([
      { $match: { user: id } },
      {
        $lookup:
        {
          from: 'articlecomments',
          localField: '_id',
          foreignField: 'sourceID',
          as: 'comments'
        },
      },
      { $project: { _id: 1, user: 1, wordCount: 1, commentCount: { $size: '$comments' }, browseCount: '$browseCount' } },
      { $group: { _id: '$user', wordCount: { $sum: '$wordCount' }, browseCount: { $sum: '$browseCount' }, commentCount: { $sum: '$commentCount' }, } },
    ]).exec();
    return data[0] || { _id: id, wordCount: 0, browseCount: 0, commentCount: 0 };
  }

}
