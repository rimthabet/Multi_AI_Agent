import Keycloak from 'keycloak-js';
import { Injectable } from '@angular/core';
import { KeycloakConf } from './KeycloakConf.service';
import { firstValueFrom } from 'rxjs';

let keycloakInstance: Keycloak;

@Injectable({
    providedIn: 'root'
})
export class KeycloakService {

    get keycloak(): Keycloak {
        return keycloakInstance;
    }

    get token(): string | undefined {
        return keycloakInstance?.token;
    }

    get tokenParsed(): any {
        return keycloakInstance?.tokenParsed;
    }

    get isAuthenticated(): boolean {
        const auth = keycloakInstance?.authenticated || false;
        return auth;
    }

    getUserInfo() {
        const info = {
            username: this.tokenParsed?.preferred_username,
            email: this.tokenParsed?.email,
            firstName: this.tokenParsed?.given_name,
            lastName: this.tokenParsed?.family_name,
            roles: this.tokenParsed?.realm_access?.roles,
            resourceAccess: this.tokenParsed?.resource_access
        };
        return info;
    }

    logout(redirectUri?: string) {
        return keycloakInstance?.logout({
            redirectUri: redirectUri
        });
    }

    hasRole(role: string): boolean {
        const has = this.tokenParsed?.realm_access?.roles?.includes(role) || false;
        return has;
    }

    hasResourceRole(resource: string, role: string): boolean {
        const has = this.tokenParsed?.resource_access?.[resource]?.roles?.includes(role) || false;
        return has;
    }

    updateToken(minValidity: number = 5): Promise<boolean> {
        return keycloakInstance?.updateToken(minValidity)
            .then(refreshed => {
                return refreshed;
            })
            .catch(err => {
                throw err;
            })
    }
}

export function initializeKeycloak(
    keycloakConf: KeycloakConf
): () => Promise<boolean> {
    return () => {
        return firstValueFrom(keycloakConf.getRealmId())
            .then((realmConfig: any) => {
                keycloakInstance = new Keycloak({
                    url: 'https://auth.nacloud.tn',
                    realm: realmConfig.realmId,
                    clientId: realmConfig.clientId,
                });
                return keycloakInstance.init({
                    onLoad: 'login-required',
                    checkLoginIframe: false,
                }).then((authenticated) => {
                    setInterval(() => {
                        keycloakInstance.updateToken(30).then(refreshed => {
                            if (refreshed) {
                            } else {
                            }
                        }).catch(() => {
                            keycloakInstance.logout();
                        });
                    }, 6000);

                    return authenticated;
                });
            })
            .catch((error) => {
                return false;
            });
    };
}
