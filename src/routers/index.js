/**
 * @flow
 */
import crossroads from 'crossroads';
import {
  RouteEntry,
  RouteHome,
} from './home';
import {
  RouteAuthLogin,
} from './auth';

class AppRouter {
  constructor() {
    this._crossroadsRouteMatched = this._crossroadsRouteMatched.bind(this);

    [
      RouteEntry,
      RouteHome,
      RouteAuthLogin,
    ].forEach(RouteClass => {
      let routeInstance = new RouteClass();
      let crossroadsRoute = crossroads.addRoute(RouteClass.PATTERN);
      crossroadsRoute._appRoute = routeInstance;
    });

    crossroads.routed.add(this._crossroadsRouteMatched);
  }

  _crossroadsRouteMatched(request, data) {
    let params = data.params[0];
    this._currentRoute = data.route._appRoute;
    this._currentParams = params;
  }

  getExRoute(route) {
      console.log(route);
    crossroads.parse(route);
    return this._currentRoute.getExRoute(this._currentParams);
  }

}

export default new AppRouter();