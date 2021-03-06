import { HttpParams } from '@angular/common/http';
import { async } from '@angular/core/testing';
import { GitHubDetails } from './github-details.model';
import { Mission } from './mission.model';
import { Projectile, StepState } from './projectile.model';

describe('State saving and restoring', () => {
  class TestableProjectile<T> extends Projectile<T> {
    protected searchParams() {
      return new URLSearchParams(this.toUrl());
    }
  }

  it('should save the state in an url', () => {
    const projectile = new TestableProjectile<GitHubDetails>();
    const gitHubDetails = new GitHubDetails();
    const state = new StepState(gitHubDetails, [
      { name: 'repository', value: 'repository' },
      { name: 'organization', value: 'organization' }
    ]);

    gitHubDetails.repository = 'repo';
    gitHubDetails.organization = 'org';
    gitHubDetails.login = 'ignored';

    projectile.setState('myId', state);

    expect(projectile.toUrl())
      .toBe('?selectedSection=&myId=%7B%22repository%22%3A%22repo%22%2C%22organization%22%3A%22org%22%7D');
    expect(projectile.getSavedState('myId')).toEqual({ repository: 'repo', organization: 'org' });
  });

  it('should create HttpParams of the state', () => {
    const projectile = new Projectile<any>();
    projectile.setState('1', new StepState<any>({ 'param1': 'value1' }, [{ name: 'p1', value: 'param1' }]));
    projectile.setState('2', new StepState<any>({ 'param2': 'value2' }, [{ name: 'p2', value: 'param2' }]));

    const http = new HttpParams()
      .append('p1', 'value1')
      .append('p2', 'value2');

    expect(projectile.toHttpPayload().toString()).toEqual(http.toString());
  });

  it('should restore state from an url', () => {
    const projectile = new TestableProjectile<{mission: Mission}>();
    const mission = new Mission();
    const state = new StepState({mission: mission}, [
      { name: 'missionId', value: 'mission.id' }
    ]);
    const id = 'health-check';
    const description = 'some description that will not be saved';

    const testStateId = 'myId';

    mission.id = id;

    const missions = { mission: [{ id: 'rest', description: 'rest endpoint' },
    { id: id, description: description }, { id: 'other', description: 'some more' }]};

    projectile.setState(testStateId, state);

    const restoredMission = projectile.restore(testStateId, missions);
    expect(restoredMission.state.mission.description).toEqual(description);
  });

  it('should set the state of the component', async(() => {
    const projectile = new TestableProjectile<any>();
    projectile.setState('newState', new StepState<any>({ 'param1': 'value1' }, [{ name: 'p1', value: 'param1' }]));
    const newState = { p1: 'value1' };
    const _newState = projectile.getSavedState('newState');
    expect(_newState).toEqual(newState);
  }));

  it('should restore shared state', () => {
    class SharedStateProjectile<T> extends Projectile<T> {
      protected searchParams() {
        // tslint:disable-next-line:max-line-length
        return new URLSearchParams('?selectedSection=&shared=%7B%22projectName%22%3A%22projectName%22%2C%22projectVersion%22%3A%22%22%2C%22groupId%22%3A%22%22%2C%22artifactId%22%3A%22some-value%22%2C%22space%22%3A%22%22%2C%22targetEnvironment%22%3A%22%22%7D');
      }
    }

    const projectile = new SharedStateProjectile();
    projectile.sharedState.state;
    projectile.restore('shared', projectile.getSavedState('shared'));
    expect(projectile.sharedState.state.projectName).toBe('projectName');
    expect(projectile.sharedState.state.artifactId).toBe('some-value');
  });

  it('should reset the state of the component', async(() => {
    const projectile = new TestableProjectile<any>();
    projectile.setState('newState', new StepState<any>({ 'param1': 'value1' }, [{ name: 'p1', value: 'param1' }]));
    projectile.resetState();
    const currentState = projectile.getSavedState('newState');
    expect(currentState).toBeNull();
  }));
});
