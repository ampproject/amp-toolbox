import cheerio from 'cheerio';
import {restore as nockRestore} from 'nock';
import {withFixture, assertEqual, runCheerioFn} from './lib';
import {schemaMetadata, corsEndpoints, isTransformedAmp} from '../src/helper';
import {_inlineMetadata as inlineMetadata} from '../src/rules/StoryMetadataThumbnailsAreOk';

afterEach(() => {
  nockRestore();
});

describe(`helper ${schemaMetadata.name}`, () => {
  it(schemaMetadata.name, async () => {
    return withFixture('getschemametadata', () =>
      assertEqual(
        runCheerioFn(
          schemaMetadata,
          'https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/'
        ),
        {
          '@context': 'http://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'item': {
                '@id': 'https://ampbyexample.com/#/stories#stories/introduction',
                'name': 'Introduction',
              },
              'position': 1,
            },
            {
              '@type': 'ListItem',
              'item': {
                '@id': 'https://ampbyexample.com/stories/introduction/amp_story_hello_world/',
                'name': ' AMP Story Hello World',
              },
              'position': 2,
            },
          ],
        }
      )
    );
  });
});

describe(`helper ${inlineMetadata.name}`, () => {
  it(inlineMetadata.name, async () => {
    return withFixture('getinlinemetadata', () =>
      assertEqual(
        runCheerioFn(inlineMetadata, 'https://ithinkihaveacat.github.io/hello-world-amp-story/'),
        {
          'poster-portrait-src': [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/',
            'Cantilever_bridge_human_model.jpg/',
            '627px-Cantilever_bridge_human_model.jpg',
          ].join(''),
          'publisher': 'Michael Stillwell',
          'publisher-logo-src':
            'https://s.gravatar.com/avatar/3928085cafc1e496fb3d990a9959f233?s=150',
          'title': 'Hello, Ken Burns',
        }
      )
    );
  });
});

describe('helper corsEndpoints', () => {
  it(`${corsEndpoints.name} - AMP`, async () => {
    return withFixture('corsendpoints1', () =>
      assertEqual(runCheerioFn(corsEndpoints, 'https://swift-track.glitch.me/'), [
        'https://ampbyexample.com/json/examples.json',
      ])
    );
  });

  it(`${corsEndpoints.name} - AMP Story`, async () => {
    return withFixture('corsendpoints2', () =>
      assertEqual(
        runCheerioFn(
          corsEndpoints,
          'https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/'
        ),
        ['https://ampbyexample.com/json/bookend.json']
      )
    );
  });
});

describe('helper isTransformedAmp', () => {
  it('isTransformedAmp with current transform value', async () => {
    const $ = cheerio.load("<html transformed='self;v=1'><body></body></html>");
    expect(isTransformedAmp($)).toEqual(true);
  });

  it('isTransformedAmp with different transform value', async () => {
    const $ = cheerio.load("<html transformed='self;v=2'><body></body></html>");
    expect(isTransformedAmp($)).toEqual(true);
  });

  it('isTransformedAmp with current transform value', async () => {
    const $ = cheerio.load("<html other='self;v=1'><body></body></html>");
    expect(isTransformedAmp($)).toEqual(false);
  });
});
