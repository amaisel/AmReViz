import ExploreView from './ExploreView';
import { events } from '../data/events';
import { colonyBoundaries } from '../data/colonyBoundaries';

export default function ExploreRoute(props) {
  return (
    <ExploreView
      events={events}
      colonyBoundaries={colonyBoundaries}
      {...props}
    />
  );
}
