#pragma once

#include "common.h"

class HttpServer {
public:
    HttpServer(int port = 8080);
    ~HttpServer();

    void start();
    void stop();
    
    // 设置路由
    void setupRoutes();
    
    // 路由注册函数
    void Get(const std::string& pattern, http::Handler handler);
    void Post(const std::string& pattern, http::Handler handler);
    void Put(const std::string& pattern, http::Handler handler);
    void Delete(const std::string& pattern, http::Handler handler);

private:
    int port_;
    bool running_;
    std::thread server_thread_;
    
    struct Route {
        std::string method;
        std::string pattern;
        http::Handler handler;
    };
    std::vector<Route> routes_;
    std::mutex routes_mutex_;
    
    // 服务器主循环
    void serverLoop();
    
    // 请求处理
    void handleRequest(const http::Request& req, http::Response& res);
    bool matchRoute(const std::string& method, const std::string& path, Route& route);
    
    // 中间件函数
    void corsMiddleware(const http::Request& req, http::Response& res);
    void loggingMiddleware(const http::Request& req, http::Response& res);
    
    // 工具函数
    json::Value createSuccessResponse(const json::Value& data, const std::string& message = "");
    json::Value createErrorResponse(const std::string& error, int code = 500);
    
    // 响应发送函数
    void sendJsonResponse(http::Response& res, const json::Value& data, int status = 200);
}; 