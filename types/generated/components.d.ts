import type { Schema, Struct } from '@strapi/strapi';

export interface MetaKeywordsMetaKeywords extends Struct.ComponentSchema {
  collectionName: 'components_meta_keywords_meta_keywords';
  info: {
    displayName: 'meta_keywords';
  };
  attributes: {
    values: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
        minLength: 4;
      }>;
  };
}

export interface ProductVariationsAttributes extends Struct.ComponentSchema {
  collectionName: 'components_product_variations_attributes';
  info: {
    displayName: 'Attributes';
    icon: 'grid';
  };
  attributes: {
    color: Schema.Attribute.String;
    discount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    images: Schema.Attribute.Media<'images', true>;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    size: Schema.Attribute.String;
    stock: Schema.Attribute.Integer & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SeoMetaSeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_seo_meta_seo_metas';
  info: {
    displayName: 'SEO_META';
  };
  attributes: {
    keys: Schema.Attribute.Component<'meta-keywords.meta-keywords', true>;
    meta_description: Schema.Attribute.Text;
    meta_image_url: Schema.Attribute.String;
    meta_title: Schema.Attribute.String;
    no_index: Schema.Attribute.Boolean;
    structured_data: Schema.Attribute.JSON;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'meta-keywords.meta-keywords': MetaKeywordsMetaKeywords;
      'product-variations.attributes': ProductVariationsAttributes;
      'seo-meta.seo-meta': SeoMetaSeoMeta;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
