import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';


@Injectable()
export class KeycloakInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url === environment.keycloakConfigUrl) {
            return next.handle(req);
        }
        const token = (window as any).keycloakInstance?.token;
        if (token) {
            const authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                },
            });
            return next.handle(authReq);
        }

        return next.handle(req);
    }
}