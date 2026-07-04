import type { DdysDisplayOptions, DdysItem, DdysResource } from '../types/ddys';
import { DdysCard } from './card';
import { DdysGrid } from './grid';
import { DdysSources } from './sources';
import { itemSummary } from './utils';

export interface DdysMovieDetailProps {
  movie: DdysItem;
  display?: DdysDisplayOptions;
  siteBaseUrl?: string;
}

export function DdysMovieDetail({ movie, display, siteBaseUrl }: DdysMovieDetailProps) {
  const summary = itemSummary(movie);
  const related = Array.isArray(movie.movies) ? movie.movies as DdysItem[] : [];
  const groups = sourceGroups(movie);

  return (
    <div className="ddys-next ddys-next-detail">
      <DdysCard item={movie} display={display} siteBaseUrl={siteBaseUrl} />
      {summary ? <div className="ddys-next-description">{summary}</div> : null}
      {Object.keys(groups).length ? <DdysSources groups={groups} /> : null}
      {related.length ? (
        <section className="ddys-next-related">
          <h3>Related</h3>
          <DdysGrid items={related} display={display} siteBaseUrl={siteBaseUrl} />
        </section>
      ) : null}
    </div>
  );
}

function sourceGroups(movie: DdysItem): Record<string, DdysResource[]> {
  const groups: Record<string, DdysResource[]> = {};
  if (Array.isArray(movie.resources)) groups.Resources = movie.resources as DdysResource[];
  if (Array.isArray(movie.sources)) groups.Sources = movie.sources as DdysResource[];
  if (Array.isArray(movie.online)) groups.Online = movie.online as DdysResource[];
  if (Array.isArray(movie.download)) groups.Download = movie.download as DdysResource[];
  return groups;
}
