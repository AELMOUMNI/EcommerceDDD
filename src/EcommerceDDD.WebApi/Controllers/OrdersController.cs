using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using EcommerceDDD.Application.Orders.PlaceOrder;
using EcommerceDDD.Application.Orders.GetOrderDetails;
using EcommerceDDD.Application.Orders.GetOrders;
using System.Collections.Generic;
using System.Net;
using BuildingBlocks.CQRS.CommandHandling;
using BuildingBlocks.CQRS.QueryHandling;
using EcommerceDDD.Application.EventSourcing.StoredEventsData;
using EcommerceDDD.Application.Orders.ListOrderStoredEvents;
using EcommerceDDD.WebApi.Controllers.Base;

namespace EcommerceDDD.WebApi.Controllers
{
    [Authorize]
    [Route("api/orders")]
    [ApiController]
    public class OrdersController : BaseController
    {
        public OrdersController(
            IMediator mediator)
            : base(mediator)
        {
        }

        /// <summary>
        /// Returns the orders placed by a given cursomer
        /// </summary>
        /// <param name="customerId"></param>
        /// <returns></returns>
        [HttpGet, Route("{customerId:guid}")]
        [Authorize(Policy = "CanRead")]
        [ProducesResponseType(typeof(List<OrderDetailsViewModel>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetOrders([FromRoute] Guid customerId)
        {
            var query = new GetOrdersQuery(customerId);
            return await Response(query);
        }

        /// <summary>
        /// Returns the details of a given order
        /// </summary>
        /// <param name="orderId"></param>
        /// <returns></returns>
        [HttpGet, Route("{customerId:guid}/{orderId:guid}/details")]
        [Authorize(Policy = "CanRead")]
        [ProducesResponseType(typeof(OrderDetailsViewModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetOrderDetails([FromRoute] Guid customerId, [FromRoute] Guid orderId)
        {
            var query = new GetOrderDetailsQuery(customerId, orderId);
            return await Response(query);
        }

        /// <summary>
        /// Place an order
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost, Route("{cartId:guid}")]
        [Authorize(Policy = "CanSave")]
        [ProducesResponseType(typeof(CommandHandlerResult<Guid>), (int)HttpStatusCode.Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> PlaceOrder([FromRoute] Guid cartId, [FromBody] PlaceOrderRequest request)
        {
            var command = new PlaceOrderCommand(cartId, request.CustomerId, request.Currency);
            return await Response(command);
        }

        /// <summary>
        /// Returns the Stored Events of a given Order
        /// </summary>
        /// <param name="customerId"></param>
        /// <returns></returns>
        [HttpGet, Route("{orderId:guid}/events")]
        [Authorize(Policy = "CanRead")]
        [ProducesResponseType(typeof(QueryHandlerResult<IList<StoredEventData>>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ListEvents([FromRoute] Guid orderId)
        {
            var query = new ListOrderStoredEventsQuery(orderId);
            return await Response(query);
        }
    }
}