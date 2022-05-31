import { createMaps } from '../src/plugins/restructure'

describe('createMaps', () => {
  it('should create a node map', () => {
    const schema = [
      {
        $el: 'div',
        meta: {
          section: 'goodSection',
        },
      },
      {
        $cmp: 'SuperComponent',
        meta: {
          index: 0,
        },
      },
    ]
    const nodeMap = new Map()
    const parentMap = new Map()
    const sectionMap = new Map()
    nodeMap.set(schema[0], {
      naturalParent: null,
      naturalIndex: 0,
      explicitParent: undefined,
      explicitIndex: undefined,
    })
    nodeMap.set(schema[1], {
      naturalParent: null,
      naturalIndex: 1,
      explicitParent: undefined,
      explicitIndex: 0,
    })
    parentMap.set(null, new Set(...[schema]))
    sectionMap.set('goodSection', new Set([schema[0]]))
    expect(
      createMaps(schema, [new Map(), new Map(), new Map()], null, 0)
    ).toEqual([nodeMap, parentMap, sectionMap])
  })

  it('creates a node map with depth', () => {
    const schema = [
      {
        $el: 'div',
        meta: {
          section: 'goodSection',
        },
        children: [
          {
            $el: 'h1',
            children: 'Hello world',
            meta: {
              section: 'title',
            },
          },
        ],
      },
      {
        $cmp: 'SuperComponent',
        meta: {
          index: 0,
        },
      },
    ]
    const nodeMap = new Map()
    const parentMap = new Map()
    const sectionMap = new Map()
    nodeMap.set(schema[0], {
      naturalParent: null,
      naturalIndex: 0,
      explicitParent: undefined,
      explicitIndex: undefined,
    })
    nodeMap.set(schema[0].children![0], {
      naturalParent: schema[0],
      naturalIndex: 0,
      explicitParent: undefined,
      explicitIndex: undefined,
    })
    nodeMap.set(
      { $el: 'text', children: 'Hello world' },
      {
        naturalParent: schema[0].children![0],
        naturalIndex: 0,
        explicitParent: undefined,
        explicitIndex: undefined,
      }
    )
    nodeMap.set(schema[1], {
      naturalParent: null,
      naturalIndex: 1,
      explicitParent: undefined,
      explicitIndex: 0,
    })
    parentMap.set(
      schema[0],
      new Set(
        ...[
          Object.assign(schema[0].children, {
            children: { $el: 'text', children: 'Hello world' },
          }),
        ]
      )
    )
    parentMap.set(
      schema[0].children![0],
      new Set([{ $el: 'text', children: 'Hello world' }])
    )
    parentMap.set(null, new Set(...[schema]))
    sectionMap.set('goodSection', new Set([schema[0]]))
    sectionMap.set('title', new Set([schema[0].children![0]]))
    expect(
      createMaps(schema, [new Map(), new Map(), new Map()], null, 0)
    ).toEqual([nodeMap, parentMap, sectionMap])
  })
})
