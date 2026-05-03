import { blogAuthorSchema } from "./blogAuthor"
import { blogCategorySchema } from "./blogCategory"
import { blogPostSchema } from "./blogPost"
import { blogSettingsSchema } from "./blogSettings"
import { blogTagSchema } from "./blogTag"
import { faqPageSchema } from "./faqPage"
import { homePageSchema } from "./homePage"
import { legalPageSchema } from "./legalPage"
import { siteSettingsSchema } from "./siteSettings"

export const schemaTypes = [
  siteSettingsSchema,
  blogSettingsSchema,
  blogAuthorSchema,
  blogCategorySchema,
  blogTagSchema,
  blogPostSchema,
  homePageSchema,
  faqPageSchema,
  legalPageSchema,
]
