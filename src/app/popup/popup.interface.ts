export interface IAccessTokenBody {
    code: string,
    client_id: string,
    redirect_uri: string,
    grant_type: string,
}