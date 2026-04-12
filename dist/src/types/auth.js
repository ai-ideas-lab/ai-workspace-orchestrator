export var AuthError;
(function (AuthError) {
    AuthError["INVALID_CREDENTIALS"] = "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF";
    AuthError["EMAIL_EXISTS"] = "\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C";
    AuthError["USERNAME_EXISTS"] = "\u7528\u6237\u540D\u5DF2\u88AB\u4F7F\u7528";
    AuthError["INVALID_TOKEN"] = "token\u65E0\u6548\u6216\u5DF2\u8FC7\u671F";
    AuthError["MISSING_TOKEN"] = "\u7F3A\u5C11\u8BA4\u8BC1token";
    AuthError["USER_NOT_FOUND"] = "\u7528\u6237\u4E0D\u5B58\u5728";
    AuthError["SERVER_ERROR"] = "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF";
})(AuthError || (AuthError = {}));
//# sourceMappingURL=auth.js.map