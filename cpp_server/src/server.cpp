#include "../include/server.h"
#include "../include/routes/wallet_routes.h"
#include "../include/routes/transaction_routes.h"
#include "../include/routes/mpc_routes.h"
#include "../include/routes/blockchain_routes.h"
#include <sstream>
#include <iomanip>
#include <ctime>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

HttpServer::HttpServer(int port) : port_(port), running_(false) {}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::start() {
    running_ = true;
    server_thread_ = std::thread(&HttpServer::serverLoop, this);
    server_thread_.join();
}

void HttpServer::stop() {
    running_ = false;
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
}

void HttpServer::Get(const std::string& pattern, http::Handler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({"GET", pattern, handler});
}

void HttpServer::Post(const std::string& pattern, http::Handler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({"POST", pattern, handler});
}

void HttpServer::Put(const std::string& pattern, http::Handler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({"PUT", pattern, handler});
}

void HttpServer::Delete(const std::string& pattern, http::Handler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({"DELETE", pattern, handler});
}

void HttpServer::setupRoutes() {
    // 健康检查端点
    Get("/health", [this](const http::Request& req, http::Response& res) {
        json::Value response;
        response["status"] = json::Value("ok");
        response["timestamp"] = json::Value(std::to_string(std::time(nullptr)));
        response["version"] = json::Value("1.0.0");
        sendJsonResponse(res, response);
    });

    // 根路径信息
    Get("/", [this](const http::Request& req, http::Response& res) {
        json::Value response;
        response["message"] = json::Value("MPC 钱包C++后端服务运行中");
        response["version"] = json::Value("1.0.0");
        
        json::Value endpoints;
        endpoints["wallet"] = json::Value("/api/wallet");
        endpoints["transaction"] = json::Value("/api/transaction");
        endpoints["mpc"] = json::Value("/api/mpc");
        endpoints["blockchain"] = json::Value("/api/blockchain");
        endpoints["health"] = json::Value("/health");
        response["endpoints"] = endpoints;
        
        sendJsonResponse(res, response);
    });

    // 设置各模块路由
    WalletRoutes::setup(*this);
    TransactionRoutes::setup(*this);
    MpcRoutes::setup(*this);
    BlockchainRoutes::setup(*this);
}

void HttpServer::serverLoop() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);

    // 创建socket
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        throw std::runtime_error("socket failed");
    }

    // 设置socket选项
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt))) {
        throw std::runtime_error("setsockopt failed");
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);

    // 绑定socket
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        throw std::runtime_error("bind failed");
    }

    // 监听连接
    if (listen(server_fd, 3) < 0) {
        throw std::runtime_error("listen failed");
    }

    while (running_) {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
            continue;
        }

        // 读取请求（简化实现）
        char buffer[1024] = {0};
        read(new_socket, buffer, 1024);

        // 解析HTTP请求
        http::Request req;
        http::Response res;
        
        std::string request_str(buffer);
        std::istringstream request_stream(request_str);
        std::string line;
        
        if (std::getline(request_stream, line)) {
            std::istringstream line_stream(line);
            line_stream >> req.method >> req.path;
        }

        // 添加中间件
        corsMiddleware(req, res);
        loggingMiddleware(req, res);

        // 处理请求
        handleRequest(req, res);

        // 发送响应
        std::string response = "HTTP/1.1 " + std::to_string(res.status) + " OK\r\n";
        for (const auto& header : res.headers) {
            response += header.first + ": " + header.second + "\r\n";
        }
        response += "\r\n" + res.body;

        send(new_socket, response.c_str(), response.length(), 0);
        close(new_socket);
    }

    close(server_fd);
}

void HttpServer::handleRequest(const http::Request& req, http::Response& res) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    
    for (const auto& route : routes_) {
        if (route.method == req.method && matchRoute(req.method, req.path, const_cast<Route&>(route))) {
            try {
                route.handler(req, res);
                return;
            } catch (const std::exception& e) {
                json::Value error = createErrorResponse(e.what());
                sendJsonResponse(res, error, 500);
                return;
            }
        }
    }

    // 404 处理
    json::Value error = createErrorResponse("接口不存在", 404);
    sendJsonResponse(res, error, 404);
}

bool HttpServer::matchRoute(const std::string& method, const std::string& path, Route& route) {
    return route.pattern == path || 
           (route.pattern.back() == '*' && path.find(route.pattern.substr(0, route.pattern.length()-1)) == 0);
}

void HttpServer::corsMiddleware(const http::Request& req, http::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void HttpServer::loggingMiddleware(const http::Request& req, http::Response& res) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::cout << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S") 
              << " - " << req.method << " " << req.path << std::endl;
}

json::Value HttpServer::createSuccessResponse(const json::Value& data, const std::string& message) {
    json::Value response;
    response["success"] = json::Value(true);
    response["data"] = data;
    if (!message.empty()) {
        response["message"] = json::Value(message);
    }
    return response;
}

json::Value HttpServer::createErrorResponse(const std::string& error, int code) {
    json::Value response;
    response["success"] = json::Value(false);
    response["error"] = json::Value(error);
    response["code"] = json::Value(static_cast<double>(code));
    return response;
}

void HttpServer::sendJsonResponse(http::Response& res, const json::Value& data, int status) {
    res.status = status;
    res.set_content(data.dump(), "application/json");
} 