import { schemaMetadata } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

export class SchemaMetadataIsNews extends Rule {
  run({ $ }: Context) {
    const metadata = schemaMetadata($);
    const type = metadata["@type"];
    if (
      type !== "Article" &&
      type !== "NewsArticle" &&
      type !== "ReportageNewsArticle"
    ) {
      return this.warn(
        `@type is not 'Article' or 'NewsArticle' or 'ReportageNewsArticle'`
      );
    } else {
      return this.pass(`@type is ${type}`);
    }
  }
  meta() {
    return {
      url: "",
      title: "schema.org metadata has news or article type",
      info: "",
    };
  }
}
