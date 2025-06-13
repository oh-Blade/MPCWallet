package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"mpc-wallet-app/mpc"
)

func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		mpcGroup := api.Group("/mpc")
		{
			mpcGroup.POST("/create-session", mpc.CreateSessionHandler)
			mpcGroup.POST("/join-session", mpc.JoinSessionHandler)
			mpcGroup.GET("/session-status", mpc.GetSessionStatusHandler)
			mpcGroup.POST("/sign-tx", mpc.SignTransactionHandler)
		}
	}

	r.Run(":8080")
}
