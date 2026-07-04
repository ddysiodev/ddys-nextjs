import type { DdysResource } from '../types/ddys';
import { resourceParts } from './utils';

export interface DdysSourcesProps {
  groups: Record<string, DdysResource[]>;
  allowedProtocols?: string[];
}

export function DdysSources({ groups, allowedProtocols = ['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:'] }: DdysSourcesProps) {
  return (
    <div className="ddys-next-sources">
      {Object.entries(groups).map(([name, resources]) => (
        <section className="ddys-next-source-group" key={name}>
          <h3>{name}</h3>
          {resources.map((resource, index) => {
            const links = resourceParts(resource, allowedProtocols);
            return (
              <p className="ddys-next-resource" key={index}>
                {links.length ? links.map((link) => <a href={link.href} target="_blank" rel="noopener noreferrer" key={link.href}>{link.label}</a>) : 'Resource'}
              </p>
            );
          })}
        </section>
      ))}
    </div>
  );
}
