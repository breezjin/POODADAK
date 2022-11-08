import { io } from "socket.io-client";

import {
  userEnteredChatroom,
  userLeftChatroom,
  chatListLoaded,
  chatConnectionFailed,
  chatConnectionRequestSent,
  socketOpened,
  chatReceived,
} from "../../features/chat/chatSlice";

const socketActionType = {
  connected: "socket/connected",
  disconnected: "socket/disconnected",
  emit: "socket/emit",
};

const socketActionCreators = {
  socketConnected: (prefix, namespace, userId, roomDBId = "") => ({
    type: socketActionType.connected,
    payload: {
      prefix,
      namespace,
      userId,
      roomDBId,
    },
  }),
  socketDisconnected: (payload) => ({
    type: socketActionType.disconnected,
    payload,
  }),
  socketEmitted: (socketEvent, socketPayload) => ({
    type: socketActionType.emit,
    payload: {
      socketEvent,
      socketPayload,
    },
  }),
};

const socketMiddleware = () => {
  let socket = null;

  return (storeAPI) => (next) => (action) => {
    if (action.type === socketActionType.connected) {
      const { prefix, namespace, userId, roomDBId } = action.payload;
      const token = localStorage.getItem("POODADAK_TOKEN");

      if (socket) {
        next();
        return;
      }

      socket = io(
        `${process.env.REACT_APP_AXIOS_BASE_URL}/${prefix}-${namespace}?room=${userId}&roomDBId=${roomDBId}`,
        {
          auth: { token },
        }
      );

      storeAPI.dispatch(chatConnectionRequestSent());

      socket.on("connect", () => {
        // eslint-disable-next-line no-console
        console.log(`client socketid ${socket.id} connected`);
        storeAPI.dispatch(socketOpened());
      });

      socket.on("joinChatroom", (chatroom) => {
        storeAPI.dispatch(userEnteredChatroom(chatroom));
      });

      socket.once("findExistingChatList", (chatList) => {
        storeAPI.dispatch(chatListLoaded(chatList));
      });

      socket.on("receiveChat", (chat) => {
        storeAPI.dispatch(chatReceived(chat));
      });

      socket.on("leaveChat", () => {
        socket.disconnect();
      });

      socket.on("disconnect", () => {
        // eslint-disable-next-line no-console
        console.log(`client socketid ${socket.id} is disconnected`);
        storeAPI.dispatch(userLeftChatroom());
        socket = null;
      });

      socket.on("db-error", (error) => {
        storeAPI.dispatch(chatConnectionFailed(error));
      });

      socket.on("connect_error", (error) => {
        storeAPI.dispatch(chatConnectionFailed(error));
      });
    }

    if (action.type === socketActionType.disconnected) {
      socket.disconnect();
    }

    if (action.type === socketActionType.emit) {
      socket.emit(action.payload.socketEvent, action.payload.socketPayload);
    }

    next(action);
  };
};

export const { socketConnected, socketDisconnected, socketEmitted } =
  socketActionCreators;

export default socketMiddleware();
