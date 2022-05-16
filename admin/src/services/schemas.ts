import { config } from '../config'
import { deep } from '../utils/deep'
import { useState, useCallback, useMemo } from 'react'
import { EntityReference, buildSchema } from '@camberi/firecms'

export const create = (aux: any) => {
  const data = {
    ...aux,
    created_at: Date.now()
  }
  return fetch(`${config.databaseURL}/schemas.json`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(r => r.json())
}

let listen = false
const onSchemas = (data: any, setData: Function) => {
  if (listen) return {
    close: () => {
      listen = false
      return evs.close()
    }
  }
  listen = true
  const evs = new EventSource(`${config.databaseURL}/schemas.json`)

  evs.addEventListener('error', (e) => {
    console.error('error', 'Error - connection was lost.')
  }, false)

  evs.addEventListener('patch', (e: any) => {
    const aux: any = JSON.parse(e.data)
    deep(data, aux.path, aux.data)
    console.log(data)
    setData(data)
  }, false)

  evs.addEventListener('put', (e: any) => {
    const aux: any = JSON.parse(e.data)
    if (aux.path === '/') {
      console.log(data, aux.data)
      setData(aux.data)
      Object.assign(data, aux.data)
    } else {
      deep(data, aux.path, aux.data)
      console.log(data, aux.path, aux.data)
      setData(data)
    }
  }, false)

  return {
    close: () => {
      listen = false
      return evs.close()
    }
  }
}

export default function useSchema() {
  const [schemas, setSchemas]: any[] = useState({})
  const schemaItems = useMemo(() => Object.values(schemas), [schemas]).sort((a: any, b: any) => a.created_at > b.created_at ? 1 : -1)

  const listenSchemas = useCallback(() => {
    return onSchemas(schemas, setSchemas)
  }, [])

  const createSchema = useCallback((data: any) => {
    return create(data)
  }, [])

  return {
    schemas,
    schemaItems,
    setSchemas,
    listenSchemas,
    createSchema
  };
}

const locales = {
  "en-US": "English (United States)",
  "es-ES": "Spanish (Spain)",
  "de-DE": "German"
};

type Any = {
  created_at: Date
  updated_at: Date
  published_at: Date
  name: string
  price?: number
  status: string
  published?: boolean
  related_products?: EntityReference[]
  main_image: string
  header_image: string
  description: string
  content: any[]
  tags: string[]
  categories: string[]
  publisher: {
    name: string
    external_id: string
  },
  expires_on: Date
}

export const defaultSchema = (name: string) => buildSchema<Any>({
  name: "Product",
  properties: {
    created_at: {
      title: "Create at",
      dataType: "timestamp"
    },
    updated_at: {
      title: "Updated at",
      dataType: "timestamp"
    },
    published_at: {
      title: "Published in",
      dataType: "timestamp"
    },
    name: {
      title: "Name",
      validation: { required: true },
      dataType: "string"
    },
    status: {
      title: "Status",
      validation: { required: true },
      dataType: "string",
      description: "Should this product be visible in the website",
      longDescription: "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
      config: {
        enumValues: {
          private: "Private",
          public: "Public"
        }
      }
    },
    main_image: { // The `buildProperty` method is an utility function used for type checking
      title: "Image",
      dataType: "string",
      config: {
        storageMeta: {
          mediaType: "image",
          storagePath: "images",
          acceptedFiles: ["image/*"]
        }
      }
    },
    header_image: {
      title: "Header image",
      dataType: "string",
      config: {
        storageMeta: {
          mediaType: "image",
          storagePath: "images",
          acceptedFiles: ["image/*"],
          metadata: {
            cacheControl: "max-age=86400"
          }
        }
      }
    },
    tags: {
      title: "Tags",
      description: "Example of generic array",
      validation: { required: true },
      dataType: "array",
      of: {
        dataType: "string"
      }
    },
    description: {
      title: "Description",
      description: "Not mandatory but it'd be awesome if you filled this up",
      longDescription: "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
      dataType: "string",
      columnWidth: 300
    },
    content: {
      title: "Content",
      description: "Example of a complex array with multiple properties as children",
      validation: { required: true },
      dataType: "array",
      columnWidth: 400,
      oneOf: {
        properties: {
          images: {
            title: "Images",
            dataType: "array",
            of: {
              dataType: "string",
              config: {
                storageMeta: {
                  mediaType: "image",
                  storagePath: "images",
                  acceptedFiles: ["image/*"]
                }
              }
            }
          },
          text: {
            dataType: "string",
            title: "Text",
            config: {
              markdown: true
            }
          },
          items: {
            title: name,
            dataType: "array",
            of: {
              dataType: "reference",
              path: name
            }
          }
        }
      }
    },
    categories: {
      title: "Categories",
      validation: { required: true },
      dataType: "array",
      of: {
        dataType: "string",
        config: {
          enumValues: {
            electronics: "Electronics",
            books: "Books",
            furniture: "Furniture",
            clothing: "Clothing",
            food: "Food"
          }
        }
      }
    },
    publisher: {
      title: "Publisher",
      description: "This is an example of a map property",
      dataType: "map",
      properties: {
        name: {
          title: "Name",
          dataType: "string"
        },
        external_id: {
          title: "External id",
          dataType: "string"
        }
      }
    },
    expires_on: {
      title: "Expires on",
      dataType: "timestamp"
    }
  }
});

export const localeSchema = buildSchema({
  customId: locales,
  name: "Locale",
  properties: {
    title: {
      title: "Title",
      validation: { required: true },
      dataType: "string"
    },
    selectable: {
      title: "Selectable",
      description: "Is this locale selectable",
      dataType: "boolean"
    },
    video: {
      title: "Video",
      dataType: "string",
      validation: { required: false },
      config: {
        storageMeta: {
          mediaType: "video",
          storagePath: "videos",
          acceptedFiles: ["video/*"]
        }
      }
    }
  }
});