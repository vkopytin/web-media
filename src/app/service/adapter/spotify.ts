import * as $ from 'jquery';


class SoptifyAdapter {

    constructor(public token: string) {

    }

    async me() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }
}

export { SoptifyAdapter };
