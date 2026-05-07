//using Xunit;
//using Moq;
//using System;
//using System.Threading;
//using System.Threading.Tasks;
//using Application.CQRS.Commands.AccommodationPosts;
//using Application.Interface;
//using Domain.Entities;
//using FluentAssertions;
//using Application.DTOs.Accommodation;
//using Domain.Common;
//using System.Timers;
//using Domain.Interface;
//using Application.Interface.Api;
//using Application.Interface.ContextSerivce;

//public class CreateAccommodationPostCommandHandlerTests
//{
//    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
//    private readonly Mock<IMapService> _mapServiceMock;
//    private readonly Mock<IUserContextService> _userContextServiceMock;
//    private readonly CreateAccommodationPostCommandHandler _handler;

//    public CreateAccommodationPostCommandHandlerTests()
//    {
//        _unitOfWorkMock = new Mock<IUnitOfWork>();
//        _mapServiceMock = new Mock<IMapService>();
//        _userContextServiceMock = new Mock<IUserContextService>();

//        // Tạo handler
//        _handler = new CreateAccommodationPostCommandHandler(
//            _unitOfWorkMock.Object,
//            _mapServiceMock.Object,
//            _userContextServiceMock.Object
//        );

//        // Mock Repository bên trong UnitOfWork
//        _unitOfWorkMock.Setup(u => u.AccommodationPostRepository.AddAsync(It.IsAny<AccommodationPost>()))
//                       .Returns(Task.CompletedTask);
//    }

//    [Fact]
//    public async Task Handle_ShouldReturn401_WhenUserNotAuthenticated()
//    {
//        // Arrange
//        _userContextServiceMock.Setup(u => u.UserId()).Returns(Guid.Empty);

//        var command = new CreateAccommodationPostCommand
//        {
//            Title = "Sample",
//            Latitude = 10,
//            Longitude = 106
//        };

//        // Act
//        var result = await _handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Code.Should().Be(401);
//        result.Message.Should().Be("User not authenticated");
//    }

//    [Fact]
//    public async Task Handle_ShouldCreatePost_WithReverseGeocodedAddress()
//    {
//        // Arrange
//        var userId = Guid.NewGuid();
//        _userContextServiceMock.Setup(u => u.UserId()).Returns(userId);
//        _mapServiceMock.Setup(m => m.GetAddressFromCoordinatesAsync(10, 106))
//                       .ReturnsAsync("123 Test Street");

//        var command = new CreateAccommodationPostCommand
//        {
//            Title = "Phòng trọ đẹp",
//            Latitude = 10,
//            Longitude = 106,
//            Price = 1.5m,
//            Area = 20
//        };

//        // Act
//        var result = await _handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Code.Should().Be(201);
//        result.Data.Address.Should().Be("123 Test Street");

//        _unitOfWorkMock.Verify(u => u.AccommodationPostRepository.AddAsync(It.IsAny<AccommodationPost>()), Times.Once);
//        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(), Times.Once);
//    }
//}
