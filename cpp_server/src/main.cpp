#include "../include/server.h"
#include <iostream>
#include <csignal>
#include <cstdlib>

HttpServer* global_server = nullptr;

void signalHandler(int signal) {
    std::cout << "\n收到信号 " << signal << "，正在关闭服务器..." << std::endl;
    if (global_server) {
        global_server->stop();
    }
    exit(0);
}

int main() {
    // 设置信号处理
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);

    try {
        // 从环境变量获取端口，默认8080
        const char* port_env = std::getenv("PORT");
        int port = port_env ? std::atoi(port_env) : 8080;
        
        std::cout << "🚀 MPC钱包C++服务器启动中..." << std::endl;
        std::cout << "📝 端口: " << port << std::endl;
        
        HttpServer server(port);
        global_server = &server;
        
        // 设置路由
        server.setupRoutes();
        
        std::cout << "🚀 MPC钱包服务器运行在端口 " << port << std::endl;
        std::cout << "📝 健康检查: http://localhost:" << port << "/health" << std::endl;
        std::cout << "🌐 API 端点: http://localhost:" << port << "/api" << std::endl;
        std::cout << "按 Ctrl+C 停止服务器" << std::endl;
        
        // 启动服务器
        server.start();
        
    } catch (const std::exception& e) {
        std::cerr << "服务器启动失败: " << e.what() << std::endl;
        return 1;
    }

    return 0;
} 